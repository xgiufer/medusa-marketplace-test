// import { Service } from 'medusa-extender';
// import { EntityManager } from 'typeorm';
// import EventBusService from '@medusajs/medusa/dist/services/event-bus';
// import { FindConfig } from '@medusajs/medusa/dist/types/common';
// import { UserService as MedusaUserService } from '@medusajs/medusa/dist/services';
// import { User } from '../entities/user.entity';
// import UserRepository from '../repositories/user.repository';
// import { MedusaError } from 'medusa-core-utils';

// type ConstructorParams = {
//     manager: EntityManager;
//     userRepository: typeof UserRepository;
//     eventBusService: EventBusService;
// };

// @Service({ override: MedusaUserService })
// export default class UserService extends MedusaUserService {
//     private readonly manager: EntityManager;
//     private readonly userRepository: typeof UserRepository;
//     private readonly eventBus: EventBusService;

//     constructor(protected readonly container: ConstructorParams) {
//         super(container);
//         this.manager = container.manager;
//         this.userRepository = container.userRepository;
//         this.eventBus = container.eventBusService;

//     }

//     public async retrieve(userId: string, config?: FindConfig<User>): Promise<User> {
//         const userRepo = this.manager.getCustomRepository(this.userRepository);
//         const validatedId = this.validateId_(userId);
//         const query = this.buildQuery_({ id: validatedId }, config);

//         const user = await userRepo.findOne(query);

//         if (!user) {
//             throw new MedusaError(MedusaError.Types.NOT_FOUND, `User with id: ${userId} was not found`);
//         }

//         return user as User;
//     }
// }

import { EntityManager } from "typeorm";
import EventBusService from "@medusajs/medusa/dist/services/event-bus";
import { FindConfig } from "@medusajs/medusa/dist/types/common";
import { MedusaError } from "medusa-core-utils";
import { UserService as MedusaUserService } from "@medusajs/medusa/dist/services";
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { Service } from "medusa-extender";
import { User } from '../entities/user.entity';
import UserRepository from '../repositories/user.repository';

type ConstructorParams = {
  manager: EntityManager;
  userRepository: typeof UserRepository;
  eventBusService: EventBusService;
  loggedInUser?: User;
};

@Service({ override: MedusaUserService })
export default class UserService extends MedusaUserService {
  private readonly manager: EntityManager;
  private readonly userRepository: typeof UserRepository;
  private readonly eventBus: EventBusService;

  constructor(protected readonly container: ConstructorParams) {
    super(container);
    this.manager = container.manager;
    this.userRepository = container.userRepository;
    this.eventBus = container.eventBusService;
    this.container = container;
  }

  withTransaction(transactionManager: EntityManager): UserService {
    if (!transactionManager) {
      return this;
    }

    const cloned = new UserService({
      ...this.container,
      manager: transactionManager,
    });

    cloned.transactionManager_ = transactionManager;

    return cloned;
  }

  public async retrieve(
    userId: string,
    config?: FindConfig<User>
  ): Promise<User> {
    const userRepo = this.manager.getCustomRepository(this.userRepository);
    // const validatedId = this.validateId_(userId);
    const query = this.buildQuery_({ id: userId }, config);

    const user = await userRepo.findOne(query);

    if (!user) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `User with id: ${userId} was not found`
      );
    }

    return user as User;
  }

  buildQuery_(selector, config = {}): object {
    if (
      Object.keys(this.container).includes("loggedInUser") &&
      this.container.loggedInUser.store_id
    ) {
      selector["store_id"] = this.container.loggedInUser.store_id;
    }

    return buildQuery(selector, config);
  }

  public async addUserToStore(user_id, store_id) {
    await this.atomicPhase_(async (m) => {
      const userRepo = m.getCustomRepository(this.userRepository);
      const query = this.buildQuery_({ id: user_id });

      const user = await userRepo.findOne(query);
      if (user) {
        user.store_id = store_id;
        await userRepo.save(user);
      }
    });
  }
}