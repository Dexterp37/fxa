/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { HealthModule } from 'fxa-shared/nestjs/health/health.module';
import { LoggerModule } from 'fxa-shared/nestjs/logger/logger.module';
import { MozLoggerService } from 'fxa-shared/nestjs/logger/logger.service';
import { MetricsFactory } from 'fxa-shared/nestjs/metrics.service';
import { SentryModule } from 'fxa-shared/nestjs/sentry/sentry.module';
import {
  createContext,
  SentryPlugin,
} from 'fxa-shared/nestjs/sentry/sentry.plugin';
import { getVersionInfo } from 'fxa-shared/nestjs/version';
import { join } from 'path';

import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';

import { UserGroupGuard } from './auth/user-group-header.guard';
import { BackendModule } from './backend/backend.module';
import Config, { AppConfig } from './config';
import { DatabaseModule } from './database/database.module';
import { DatabaseService } from './database/database.service';
import { EventLoggingModule } from './event-logging/event-logging.module';
import { GqlModule } from './gql/gql.module';
import { NewslettersModule } from './newsletters/newsletters.module';
import { SubscriptionModule } from './subscriptions/subscriptions.module';

import { NotifierSnsFactory, NotifierService } from '@fxa/shared/notifier';

const version = getVersionInfo(__dirname);

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [(): AppConfig => Config.getProperties()],
      isGlobal: true,
    }),
    BackendModule,
    DatabaseModule,
    EventLoggingModule,
    SubscriptionModule,
    NewslettersModule,
    GqlModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule, SentryModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        path: '/graphql',
        useGlobalPrefix: true,
        allowBatchedHttpRequests: true,
        playground: configService.get<string>('env') !== 'production',
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        definitions: {
          path: join(process.cwd(), 'src/graphql.ts'),
        },
        context: ({ req, connection }: any) =>
          createContext({ req, connection }),
        fieldResolverEnhancers: ['guards'],
      }),
    }),
    HealthModule.forRootAsync({
      imports: [DatabaseModule],
      inject: [DatabaseService],
      useFactory: async (db: DatabaseService) => ({
        version,
        extraHealthData: () => db.dbHealthCheck(),
      }),
    }),
    LoggerModule,
    SentryModule.forRootAsync({
      imports: [ConfigModule, LoggerModule],
      inject: [ConfigService, MozLoggerService],
      useFactory: (configService: ConfigService<AppConfig>) => ({
        sentryConfig: {
          sentry: configService.get('sentry'),
          version: version.version,
        },
      }),
    }),
  ],
  controllers: [],
  providers: [
    MetricsFactory,
    {
      provide: APP_GUARD,
      useClass: UserGroupGuard,
    },
    SentryPlugin,
    NotifierSnsFactory,
    NotifierService,
  ],
})
export class AppModule {}
