import { EntityEventType, MedusaEventHandlerParams, OnMedusaEntityEvent, Service } from 'medusa-extender';

import { EntityManager } from "typeorm";
import { ProductService as MedusaProductService } from '@medusajs/medusa/dist/services';
import { FilterableProductProps, FindProductConfig } from '@medusajs/medusa/dist/types/product';
import { Selector } from '@medusajs/medusa/dist/types/common';
import { FindWithoutRelationsOptions } from '@medusajs/medusa/dist/repositories/product';
import { Product } from '../entities/product.entity';
import { User } from '../../user/entities/user.entity';
import UserService from '../../user/services/user.service';
import { Product as MedusaProduct } from '@medusajs/medusa';


type ConstructorParams = {
    manager: any;
    loggedInUser: User;
    productRepository: any;
    productVariantRepository: any;
    productOptionRepository: any;
    eventBusService: any;
    productVariantService: any;
    productCollectionService: any;
    productTypeRepository: any;
    productTagRepository: any;
    imageRepository: any;
    searchService: any;
    userService: UserService;
}

type PrepareListQueryRes = {
    q: string;
    relations: (keyof MedusaProduct)[];
    query: FindWithoutRelationsOptions;
}

@Service({ scope: 'SCOPED', override: MedusaProductService })
export class ProductService extends MedusaProductService {
    readonly manager: EntityManager;

    constructor(protected readonly container: ConstructorParams) {
        super(container);
        this.manager = container.manager;
    }

    prepareListQuery_(selector: FilterableProductProps | Selector<Product>, config: FindProductConfig): PrepareListQueryRes {
        const loggedInUser = this.container.loggedInUser
        if (loggedInUser) {
            selector['store_id'] = loggedInUser.store_id
        }

        return super.prepareListQuery_(selector, config);
    }

    @OnMedusaEntityEvent.Before.Insert(Product, { async: true })
    public async attachStoreToProduct(
        params: MedusaEventHandlerParams<Product, 'Insert'>
    ): Promise<EntityEventType<Product, 'Insert'>> {
        const { event } = params;
        const loggedInUser = this.container.loggedInUser;
        event.entity.store_id = loggedInUser.store_id;
        return event;
    }

}