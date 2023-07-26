/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from 'chai';
import Cocktail from 'cocktail';
import EmailOptInMixin from 'views/mixins/email-opt-in-mixin';
import NEWSLETTERS from 'lib/newsletters';
import sinon from 'sinon';
import BaseView from 'views/base';

class View extends BaseView {
  template(context) {
    const newsletters = context.newsletters.map((newsletter) => {
      //eslint-disable-next-line max-len
      return `<div id="newsletters-optin"><input type="checkbox" id="${newsletter.slug}" class="marketing-email-optin" value="${newsletter.slug}" /><label for="${newsletter.slug}" >${newsletter.label}</label></div>`;
    });
    return `<div>${newsletters.join('\n')}</div>`;
  }
}

Cocktail.mixin(View, EmailOptInMixin);

describe('views/mixins/email-opt-in-mixin', () => {
  let experimentGroupingRules;
  let marketingEmailEnabled;
  let getExperimentGroup;
  let view;

  beforeEach(() => {
    experimentGroupingRules = {
      choose: () => {},
    };
    getExperimentGroup = () => false;
    marketingEmailEnabled = true;

    view = new View({
      experimentGroupingRules,
      getExperimentGroup,
      marketingEmailEnabled,
    });
  });

  it('exports correct interface', () => {
    assert.isObject(EmailOptInMixin);
    assert.lengthOf(Object.keys(EmailOptInMixin), 8);
    assert.isFunction(EmailOptInMixin.initialize);
    assert.isFunction(EmailOptInMixin.setInitialContext);
    assert.isFunction(EmailOptInMixin.isEmailOptInEnabled);
    assert.isFunction(EmailOptInMixin.isAnyNewsletterVisible);
    assert.isFunction(EmailOptInMixin.getOptedIntoNewsletters);
    assert.isFunction(EmailOptInMixin._hasOptedIntoNewsletter);
    assert.isFunction(EmailOptInMixin._newsletterTypeToSelector);
    assert.isFunction(EmailOptInMixin._getNewsletters);
  });

  describe('render', () => {
    let communicationPrefsVisible;

    beforeEach(() => {
      sinon
        .stub(experimentGroupingRules, 'choose')
        .callsFake(() => communicationPrefsVisible);
      sinon.spy(view, 'template');
    });

    describe('enabled for user', () => {
      beforeEach(() => {
        communicationPrefsVisible = true;
      });

      it('sets `isAnyNewsletterEnabled=true`', () => {
        return view.render().then(() => {
          assert.isTrue(view.template.calledOnce);
          const templateArgs = view.template.args[0][0];
          assert.isTrue(templateArgs.isAnyNewsletterEnabled);
        });
      });

      it('renders the expected newsletters', () => {
        return view.render().then(() => {
          const templateArgs = view.template.args[0][0];
          assert.lengthOf(templateArgs.newsletters, 3);
          assert.isTrue(view.isAnyNewsletterVisible());
        });
      });
    });

    describe('disabled for user', () => {
      beforeEach(() => {
        communicationPrefsVisible = false;
        return view.render();
      });

      it('sets `isEmailOptInEnabled=false`', () => {
        assert.isTrue(view.template.calledOnce);
        const templateArgs = view.template.args[0][0];
        assert.isFalse(templateArgs.isAnyNewsletterEnabled);
        assert.lengthOf(templateArgs.newsletters, 0);

        assert.isFalse(view.isAnyNewsletterVisible());
      });
    });
  });

  describe('getOptedIntoNewsletters', () => {
    beforeEach(() => {
      sinon.stub(experimentGroupingRules, 'choose').callsFake(() => true);
      return view.render();
    });

    it('returns list of newsletters that are checked', () => {
      view
        .$(view._newsletterTypeToSelector(NEWSLETTERS.CONSUMER_BETA))
        .attr('checked', 'checked');
      view
        .$(view._newsletterTypeToSelector(NEWSLETTERS.HEALTHY_INTERNET))
        .attr('checked', 'checked');
      view;
      assert.sameMembers(view.getOptedIntoNewsletters(), [
        'test-pilot',
        'take-action-for-the-internet',
      ]);
    });

    it('returns list of expected newsletters when newsletter is array of slugs', () => {
      view
        .$(view._newsletterTypeToSelector(NEWSLETTERS.SECURITY_PRIVACY))
        .attr('checked', 'checked');
      view
        .$(view._newsletterTypeToSelector(NEWSLETTERS.HEALTHY_INTERNET))
        .attr('checked', 'checked');
      view;
      assert.sameMembers(view.getOptedIntoNewsletters(), [
        'take-action-for-the-internet',
        'security-privacy-news',
        'mozilla-accounts',
      ]);
    });
  });

  describe('returns new copy for newsletter experiment', () => {
    beforeEach(() => {
      sinon.stub(experimentGroupingRules, 'choose').callsFake(() => true);
      return view.render();
    });

    it('returns list of newsletters', () => {
      assert.equal(
        view.$(`label[for="${NEWSLETTERS.CONSUMER_BETA.slug}"]`).text(),
        'Early access to test new products'
      );
    });

    it('renders unescaped label as expected', () => {
      assert.equal(
        view.$(`label[for="${NEWSLETTERS.SECURITY_PRIVACY.slug}"]`).text(),
        'Security & privacy news and updates'
      );
    });
  });
});
