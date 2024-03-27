/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { StatsD } from 'hot-shots';
import { CloudTasks } from './cloud-tasks';
import { CloudTasksClient } from '@google-cloud/tasks';
import {
  DeleteAccountCloudTaskConfig,
  DeleteAccountTask,
} from './account-tasks.types';

/** Responsible for account deletion tasks */
export class AccountTasks extends CloudTasks {
  constructor(
    protected override config: DeleteAccountCloudTaskConfig,
    protected cloudTaskClient: Pick<CloudTasksClient, 'createTask' | 'getTask'>,
    protected statsd: Pick<StatsD, 'increment'>
  ) {
    super(config, cloudTaskClient);
  }

  /** Add an account to the task queue. */
  public async deleteAccount(deleteTask: DeleteAccountTask) {
    try {
      const result = await this.enqueueTask({
        queueName: this.config.cloudTasks.deleteAccounts.queueName,
        taskUrl: this.config.cloudTasks.deleteAccounts.taskUrl,
        task: deleteTask,
      });
      const taskName = result[0].name;

      this.statsd.increment('cloud-tasks.account-delete.enqueue.success');
      return taskName;
    } catch (err) {
      this.statsd.increment('cloud-tasks.account-delete.enqueue.failure');
      throw err;
    }
  }
}
