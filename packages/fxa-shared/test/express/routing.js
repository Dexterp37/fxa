/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { CelebrateError } = require('celebrate');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const assert = { ...sinon.assert, ...require('chai').assert };

describe('express/routing:', () => {
  let appMock;
  let celebrateHandler;
  let celebrateMock;
  let corsHandler;
  let errorHandler;
  let isCelebrateError;
  let loggerMock;
  let routing;
  let routingFactory;
  let mockSentry;
  let sentryScope;

  beforeEach(() => {
    celebrateHandler = () => {};
    isCelebrateError = false;
    errorHandler = sinon.spy();

    celebrateMock = {
      celebrate: () => celebrateHandler,
      isCelebrateError: () => isCelebrateError,
      errors: () => errorHandler,
    };

    corsHandler = () => {};

    mockSentry = {
      withScope: sinon.stub().callsFake((cb) => {
        sentryScope = { setContext: sinon.stub() };
        cb(sentryScope);
      }),
      captureMessage: sinon.stub(),
    };

    routingFactory = proxyquire('../../express/routing', {
      celebrate: celebrateMock,
      './cors': { default: () => corsHandler },
      '@sentry/node': mockSentry,
    });

    appMock = {
      delete: sinon.spy(),
      get: sinon.spy(),
      options: sinon.spy(),
      post: sinon.spy(),
      put: sinon.spy(),
    };

    loggerMock = {
      error: sinon.spy(),
    };

    routing = routingFactory.default(appMock, loggerMock);
  });

  it('exposes the correct interface', () => {
    assert.lengthOf(Object.keys(routing), 2);
    assert.isFunction(routing.addRoute);
    assert.isFunction(routing.validationErrorHandler);
  });

  describe('addRoute', () => {
    it('logs and throws on invalid route definitions', () => {
      const routeDefinition = {
        path: 'no-process-no-method',
      };

      try {
        routing.addRoute(routeDefinition);
        assert.fail();
      } catch (err) {
        assert.equal(err.message, 'Invalid route definition');
        assert.isTrue(
          loggerMock.error.calledOnceWith('route definition invalid: '),
          routeDefinition
        );
      }
    });

    it('handles a basic route', () => {
      const routeDefinition = {
        method: 'get',
        path: '/metrics',
        process: () => {},
      };

      routing.addRoute(routeDefinition);

      assert.isFalse(appMock.options.called);
      assert.isTrue(
        appMock.get.calledOnceWith('/metrics', routeDefinition.process)
      );
    });

    it('handles a route with CORS enabled', () => {
      const corsConfig = {
        foo: 'bar',
      };

      const routeDefinition = {
        method: 'post',
        path: '/cors-enabled',
        process: () => {},
        cors: corsConfig,
      };

      routing.addRoute(routeDefinition);

      assert.isTrue(
        appMock.options.calledOnceWith('/cors-enabled', corsHandler)
      );
      assert.isTrue(
        appMock.post.calledOnceWith(
          '/cors-enabled',
          corsHandler,
          routeDefinition.process
        )
      );
    });

    it('handles a route with preProcess', () => {
      const routeDefinition = {
        method: 'delete',
        path: '/preProcess-enabled',
        preProcess: () => {},
        process: () => {},
      };

      routing.addRoute(routeDefinition);

      assert.isFalse(appMock.options.called);
      assert.isTrue(
        appMock.delete.calledOnceWith(
          '/preProcess-enabled',
          routeDefinition.preProcess,
          routeDefinition.process
        )
      );
    });

    it('handles a route with validate', () => {
      const validate = {
        body: {
          foo: 'bar',
        },
      };

      const routeDefinition = {
        method: 'put',
        path: '/validate-enabled',
        process: () => {},
        validate,
      };

      routing.addRoute(routeDefinition);

      assert.isFalse(appMock.options.called);
      assert.isTrue(
        appMock.put.calledOnceWith(
          '/validate-enabled',
          celebrateHandler,
          routeDefinition.process
        )
      );
    });

    it('handles all the options', () => {
      const validate = {
        body: {
          foo: 'bar',
        },
      };

      const routeDefinition = {
        cors: {
          foo: 'bar',
        },
        method: 'get',
        path: '/all-options',
        preProcess: () => {},
        process: () => {},
        validate,
      };

      routing.addRoute(routeDefinition);

      assert.isTrue(
        appMock.options.calledOnceWith('/all-options', corsHandler)
      );
      assert.isTrue(
        appMock.get.calledOnceWith(
          '/all-options',
          corsHandler,
          routeDefinition.preProcess,
          celebrateHandler,
          routeDefinition.process
        )
      );
    });
  });

  describe('validationErrorHandler', () => {
    it('logs and delegates validation errors to celebrate', () => {
      const error = new Error('uh oh');
      const next = sinon.spy();
      isCelebrateError = true;

      routing.validationErrorHandler(error, {}, {}, next);

      assert.isFalse(next.calledOnceWith(error));
      assert.isTrue(errorHandler.calledOnceWith(error, {}, {}, next));
    });

    it('passes on other errors to the next error handler', () => {
      const error = new Error('uh oh');
      const next = sinon.spy();
      isCelebrateError = false;

      routing.validationErrorHandler(error, {}, {}, next);

      assert.isTrue(next.calledOnceWith(error));
      assert.isFalse(errorHandler.called);
    });

    it('logs joi validation errors and reports them to sentry', () => {
      const error = new CelebrateError();
      const next = sinon.spy();

      error.details.set('body', {
        name: 'ValidationError',
        isJoi: true,
        message: 'joi validation error',
        details: [
          {
            message: 'joi error',
            path: [''],
            type: '',
          },
        ],
      });
      isCelebrateError = true;

      routing.validationErrorHandler(error, {}, {}, next);
      assert.calledTwice(loggerMock.error);
      assert.calledWith(loggerMock.error, 'joi.validationError', {
        err: error,
        joiErrors: error.details.get('body').message,
      });

      assert.isTrue(mockSentry.withScope.calledOnce);
      assert.isTrue(
        mockSentry.captureMessage.calledOnceWith(
          'Joi validation error',
          'error'
        )
      );
    });
  });
});
