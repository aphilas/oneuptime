import PositiveNumber from 'Common/Types/PositiveNumber';
import ComponentModel from '../Models/component';
import ObjectID from 'Common/Types/ObjectID';
import Plans from '../config/plans';
import RealTimeService from './realTimeService';
import NotificationService from './NotificationService';
import ProjectService from './ProjectService';
import PaymentService from './PaymentService';
import MonitorService from './MonitorService.ts.temp';
import TeamService from './TeamService';
import { IS_SAAS_SERVICE } from '../config/server';
import getSlug from '../Utils/getSlug';
import BadDataException from 'Common/Types/Exception/BadDataException';
import FindOneBy from '../Types/DB/FindOneBy';
import FindBy from '../Types/DB/FindBy';
import Query from '../Types/DB/Query';

export default class Service {
    /*
     * Description: Upsert function for component.
     * Params:
     * Param 1: data: ComponentModal.
     * Returns: promise with component model or error.
     */
    public async create(data: $TSFixMe): void {
        const existingComponentCount: $TSFixMe = await this.countBy({
            name: data.name,
            projectId: data.projectId,
        });

        if (existingComponentCount && existingComponentCount > 0) {
            throw new BadDataException(
                'Component with that name already exists.'
            );
        }

        let project: $TSFixMe = await ProjectService.findOneBy({
            query: { _id: data.projectId },
            select: 'parentProjectId _id stripePlanId seats',
        });
        if (project.parentProjectId) {
            const subProjectComponentsCount: $TSFixMe = await this.countBy({
                name: data.name,
                projectId: project.parentProjectId,
            });
            if (subProjectComponentsCount && subProjectComponentsCount > 0) {
                const error: $TSFixMe = new Error(
                    'Component with that name already exists.'
                );

                error.code = 400;
                throw error;
            }

            project = await ProjectService.findOneBy({
                query: { _id: project.parentProjectId },
                select: '_id stripePlanId seats',
            });
        }
        let subProjectIds: $TSFixMe = [];

        const subProjects: $TSFixMe = await ProjectService.findBy({
            query: { parentProjectId: project._id },
            select: '_id',
        });
        if (subProjects && subProjects.length > 0) {
            subProjectIds = subProjects.map((project: $TSFixMe) => {
                return project._id;
            });
        }
        subProjectIds.push(project._id);
        const count: $TSFixMe = await this.countBy({
            projectId: { $in: subProjectIds },
        });
        let plan: $TSFixMe = Plans.getPlanById(project.stripePlanId);
        // Null plan => enterprise plan

        plan = plan && plan.category ? plan : { category: 'Enterprise' };

        let projectSeats: $TSFixMe = project.seats;
        if (typeof projectSeats === 'string') {
            projectSeats = parseInt(projectSeats);
        }
        if (!plan && IS_SAAS_SERVICE) {
            throw new BadDataException('Invalid project plan.');
        } else {
            const unlimitedComponent: $TSFixMe = ['Scale', 'Enterprise'];
            const componentCount: $TSFixMe =
                plan.category === 'Startup'
                    ? 5
                    : plan.category === 'Growth'
                    ? 10
                    : 0;

            if (
                count < projectSeats * componentCount ||
                !IS_SAAS_SERVICE ||
                unlimitedComponent.includes(plan.category)
            ) {
                const component: $TSFixMe = new ComponentModel();

                component.name = data.name;

                component.createdById = data.createdById;

                component.visibleOnStatusPage = data.visibleOnStatusPage;

                component.projectId = data.projectId;
                if (data && data.name) {
                    component.slug = getSlug(data.name);
                }
                const savedComponent: $TSFixMe = await component.save();

                const populateComponent: $TSFixMe = [
                    { path: 'projectId', select: 'name' },
                    { path: 'componentCategoryId', select: 'name' },
                ];

                const selectComponent: $TSFixMe =
                    '_id createdAt name createdById projectId slug componentCategoryId';

                const populatedComponent: $TSFixMe = await this.findOneBy({
                    query: { _id: savedComponent._id },
                    select: selectComponent,
                    populate: populateComponent,
                });

                return populatedComponent || savedComponent;
            }
            const error: $TSFixMe = new Error(
                "You can't add any more components. Please add an extra seat to add more components."
            );

            error.code = 400;
            throw error;
        }
    }

    public async updateOneBy(
        query: Query,
        data: $TSFixMe,
        unsetData: $TSFixMe
    ): void {
        if (!query) {
            query = {};
        }

        if (!query.deleted) {
            query.deleted = false;
        }
        if (data && data.name) {
            data.slug = getSlug(data.name);
        }
        let component: $TSFixMe = await ComponentModel.findOneAndUpdate(
            query,
            { $set: data },
            {
                new: true,
            }
        );
        if (unsetData) {
            component = await ComponentModel.findOneAndUpdate(
                query,
                { $unset: unsetData },
                {
                    new: true,
                }
            );
        }
        query.deleted = false;

        const populateComponent: $TSFixMe = [
            { path: 'projectId', select: 'name' },
            { path: 'componentCategoryId', select: 'name' },
        ];

        const selectComponent: $TSFixMe =
            '_id createdAt name createdById projectId slug componentCategoryId';
        component = await this.findOneBy({
            query,
            select: selectComponent,
            populate: populateComponent,
        });

        // Run in the background
        RealTimeService.componentEdit(component);

        return component;
    }

    public async updateBy(query: Query, data: $TSFixMe): void {
        if (!query) {
            query = {};
        }

        if (!query.deleted) {
            query.deleted = false;
        }
        let updatedData: $TSFixMe = await ComponentModel.updateMany(query, {
            $set: data,
        });
        const populateComponent: $TSFixMe = [
            { path: 'projectId', select: 'name' },
            { path: 'componentCategoryId', select: 'name' },
        ];

        const selectComponent: $TSFixMe =
            '_id createdAt name createdById projectId slug componentCategoryId';
        updatedData = await this.findBy({
            query,
            populate: populateComponent,
            select: selectComponent,
        });
        return updatedData;
    }

    /*
     * Description: Gets all components by project.
     * Params:
     * Param 1: data: ComponentModal.
     * Returns: promise with component model or error.
     */
    public async findBy({
        query,
        limit,
        skip,
        select,
        populate,
        sort,
    }: FindBy): void {
        if (!skip) {
            skip = 0;
        }

        if (!limit) {
            limit = 0;
        }

        if (typeof skip === 'string') {
            skip = parseInt(skip);
        }

        if (typeof limit === 'string') {
            limit = parseInt(limit);
        }

        if (!query) {
            query = {};
        }

        if (!query.deleted) {
            query.deleted = false;
        }
        const componentsQuery: $TSFixMe = ComponentModel.find(query)
            .lean()
            .sort(sort)
            .limit(limit.toNumber())
            .skip(skip.toNumber());

        componentsQuery.select(select);
        componentsQuery.populate(populate);

        const components: $TSFixMe = await componentsQuery;
        return components;
    }

    public async findOneBy({ query, select, populate, sort }: FindOneBy): void {
        if (!query) {
            query = {};
        }

        if (!query.deleted) {
            query.deleted = false;
        }
        const componentQuery: $TSFixMe = ComponentModel.findOne(query)
            .sort(sort)
            .lean();

        componentQuery.select(select);
        componentQuery.populate(populate);

        const component: $TSFixMe = await componentQuery;
        return component;
    }

    public async countBy(query: Query): void {
        if (!query) {
            query = {};
        }

        if (!query.deleted) {
            query.deleted = false;
        }
        const count: $TSFixMe = await ComponentModel.countDocuments(query);
        return count;
    }

    public async deleteBy(query: Query, userId: ObjectID): void {
        if (!query) {
            query = {};
        }

        query.deleted = false;
        const component: $TSFixMe = await ComponentModel.findOneAndUpdate(
            query,
            {
                $set: {
                    deleted: true,
                    deletedAt: Date.now(),
                    deletedById: userId,
                },
            },
            { new: true }
        ).populate('deletedById', 'name');

        if (component) {
            let subProject: $TSFixMe = null;

            let project: $TSFixMe = await ProjectService.findOneBy({
                query: { _id: component.projectId },
                select: 'parentProjectId _id seats stripeSubscriptionId',
            });
            if (project.parentProjectId) {
                subProject = project;

                project = await ProjectService.findOneBy({
                    query: { _id: subProject.parentProjectId },
                    select: '_id seats stripeSubscriptionId',
                });
            }

            let subProjectIds: $TSFixMe = [];

            const subProjects: $TSFixMe = await ProjectService.findBy({
                query: { parentProjectId: project._id },
                select: '_id',
            });
            if (subProjects && subProjects.length > 0) {
                subProjectIds = subProjects.map((project: $TSFixMe) => {
                    return project._id;
                });
            }
            subProjectIds.push(project._id);
            const componentsCount: $TSFixMe = await this.countBy({
                projectId: { $in: subProjectIds },
            });
            let projectSeats: $TSFixMe = project.seats;
            if (typeof projectSeats === 'string') {
                projectSeats = parseInt(projectSeats);
            }
            const projectUsers: $TSFixMe = await TeamService.getTeamMembersBy({
                parentProjectId: project._id,
            });
            const seats: $TSFixMe = await TeamService.getSeats(projectUsers);
            // Check if project seats are more based on users in project or by count of components
            if (
                !IS_SAAS_SERVICE ||
                (projectSeats &&
                    projectSeats > seats &&
                    componentsCount > 0 &&
                    componentsCount <= (projectSeats - 1) * 5)
            ) {
                projectSeats = projectSeats - 1;
                if (IS_SAAS_SERVICE) {
                    await PaymentService.changeSeats(
                        project.stripeSubscriptionId,
                        projectSeats
                    );
                }
                await ProjectService.updateOneBy(
                    { _id: project._id },
                    { seats: projectSeats.toString() }
                );
            }
            const monitors: $TSFixMe = await MonitorService.findBy({
                query: { componentId: component._id },
                select: '_id',
            });

            for (const monitor of monitors) {
                await MonitorService.deleteBy({ _id: monitor._id }, userId);
            }

            NotificationService.create(
                component.projectId,
                `A Component ${component.name} was deleted from the project by ${component.deletedById.name}`,
                component.deletedById._id,
                'componentaddremove'
            );
            // Run in the background
            RealTimeService.sendComponentDelete(component);

            return component;
        }
        return null;
    }

    public async getComponentsBySubprojects(
        subProjectIds: $TSFixMe,
        limit: PositiveNumber,
        skip: PositiveNumber
    ): void {
        if (typeof limit === 'string') {
            limit = parseInt(limit);
        }
        if (typeof skip === 'string') {
            skip = parseInt(skip);
        }

        const populateComponent: $TSFixMe = [
            { path: 'projectId', select: 'name' },
            { path: 'componentCategoryId', select: 'name' },
        ];

        const selectComponent: $TSFixMe =
            '_id createdAt name createdById projectId slug componentCategoryId';

        const subProjectComponents: $TSFixMe = await Promise.all(
            subProjectIds.map(async (id: $TSFixMe) => {
                const components: $TSFixMe = await this.findBy({
                    query: { projectId: id },
                    limit,
                    skip,
                    populate: populateComponent,
                    select: selectComponent,
                });
                const count: $TSFixMe = await this.countBy({ projectId: id });
                return { components, count, _id: id, skip, limit };
            })
        );
        return subProjectComponents;
    }

    public async getComponentsByPaginate(
        projectId: ObjectID,
        limit: PositiveNumber,
        skip: PositiveNumber
    ): void {
        if (typeof limit === 'string') {
            limit = parseInt(limit);
        }
        if (typeof skip === 'string') {
            skip = parseInt(skip);
        }

        const populate: $TSFixMe = [
            { path: 'projectId', select: 'name' },
            { path: 'componentCategoryId', select: 'name' },
        ];

        const select: $TSFixMe =
            '_id createdAt name createdById projectId slug componentCategoryId';

        const [components, count]: $TSFixMe = await Promise.all([
            this.findBy({
                query: { projectId },
                limit,
                skip,
                populate,
                select,
            }),
            this.countBy({ projectId }),
        ]);
        return { components, count, _id: projectId, skip, limit };
    }

    public async addSeat(query: Query): void {
        const project: $TSFixMe = await ProjectService.findOneBy({
            query,
            select: 'seats stripeSubscriptionId _id',
        });
        let projectSeats: $TSFixMe = project.seats;
        if (typeof projectSeats === 'string') {
            projectSeats = parseInt(projectSeats);
        }
        projectSeats = projectSeats + 1;
        if (IS_SAAS_SERVICE) {
            await PaymentService.changeSeats(
                project.stripeSubscriptionId,
                projectSeats
            );
        }
        await ProjectService.updateOneBy(
            { _id: project._id },
            { seats: String(projectSeats) }
        );
        return 'A new seat added. Now you can add a component';
    }

    public async restoreBy(query: Query): void {
        query.deleted = true;
        const populateComponent: $TSFixMe = [
            { path: 'projectId', select: 'name' },
            { path: 'componentCategoryId', select: 'name' },
        ];

        const selectComponent: $TSFixMe =
            '_id createdAt name createdById projectId slug componentCategoryId';
        let component: $TSFixMe = await this.findBy({
            query,
            populate: populateComponent,
            select: selectComponent,
        });
        if (component && component.length > 1) {
            const components: $TSFixMe = await Promise.all(
                component.map(async (component: $TSFixMe) => {
                    const componentId: $TSFixMe = component._id;

                    component = await this.updateOneBy(
                        { _id: componentId, deleted: true },
                        {
                            deleted: false,
                            deletedAt: null,
                            deleteBy: null,
                        }
                    );
                    await MonitorService.restoreBy({
                        componentId,
                        deleted: true,
                    });
                    return component;
                })
            );
            return components;
        }
        component = component[0];
        if (component) {
            const componentId: $TSFixMe = component._id;

            component = await this.updateOneBy(
                { _id: componentId, deleted: true },
                {
                    deleted: false,
                    deletedAt: null,
                    deleteBy: null,
                }
            );
            await MonitorService.restoreBy({
                componentId,
                deleted: true,
            });
        }
        return component;
    }
}