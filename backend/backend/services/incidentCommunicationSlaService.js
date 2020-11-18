const IncidentCommunicationSlaModel = require('../models/incidentCommunicationSla');
const isArrayUnique = require('../utils/isArrayUnique');
const ErrorService = require('./errorService');

module.exports = {
    create: async function(data) {
        try {
            if (!data.monitors || data.monitors.length === 0) {
                const error = new Error(
                    'You need at least one monitor to create an incident SLA'
                );
                error.code = 400;
                throw error;
            }

            if (!isArrayUnique(data.monitors)) {
                const error = new Error(
                    'You cannot have multiple selection of a monitor'
                );
                error.code = 400;
                throw error;
            }

            let incidentCommunicationSla = await this.findOneBy({
                name: data.name,
                projectId: data.projectId,
            });
            if (incidentCommunicationSla) {
                const error = new Error(
                    'Incident communication SLA with the same name already exist'
                );
                error.code = 400;
                throw error;
            }

            incidentCommunicationSla = await this.findOneBy({
                projectId: data.projectId,
                'monitors.monitorId': { $in: data.monitors },
            });

            if (incidentCommunicationSla) {
                const error = new Error(
                    'A monitor cannot be in more than one incident communication SLA'
                );
                error.code = 400;
                throw error;
            }

            // reassign data.monitors to match schema design
            data.monitors = data.monitors.map(monitor => ({
                monitorId: monitor,
            }));

            if (data.isDefault) {
                // automatically set isDefault to false
                // for any previous SLA with a default status
                await IncidentCommunicationSlaModel.findOneAndUpdate(
                    {
                        projectId: data.projectId,
                        isDefault: true,
                    },
                    { $set: { isDefault: false } }
                );
            }

            const createdIncidentCommunicationSla = await IncidentCommunicationSlaModel.create(
                data
            );

            return createdIncidentCommunicationSla;
        } catch (error) {
            ErrorService.log('incidentCommunicationSlaService.create', error);
            throw error;
        }
    },
    findOneBy: async function(query) {
        try {
            if (!query) query = {};

            if (!query.deleted) query.deleted = false;

            const incidentCommunicationSla = await IncidentCommunicationSlaModel.findOne(
                query
            )
                .populate('projectId')
                .populate('monitors.monitorId')
                .lean();

            return incidentCommunicationSla;
        } catch (error) {
            ErrorService.log(
                'incidentCommunicationSlaService.findOneBy',
                error
            );
            throw error;
        }
    },
    findBy: async function(query, limit, skip) {
        try {
            if (!skip) skip = 0;

            if (!limit) limit = 0;

            if (typeof skip === 'string') skip = Number(skip);

            if (typeof limit === 'string') limit = Number(limit);

            if (!query) query = {};

            if (!query.deleted) query.deleted = false;

            const incidentCommunicationSla = await IncidentCommunicationSlaModel.find(
                query
            )
                .sort([['createdAt', -1]])
                .limit(limit)
                .skip(skip)
                .populate('projectId')
                .populate('monitors.monitorId');

            return incidentCommunicationSla;
        } catch (error) {
            ErrorService.log('incidentCommunicationSlaService.findBy', error);
            throw error;
        }
    },
    updateOneBy: async function(query, data) {
        try {
            if (!query) query = {};

            if (!query.deleted) query.deleted = false;

            // check if we are only setting default sla
            // or using update modal for editing the details
            if (!data.handleDefault) {
                if (!data.monitors || data.monitors.length === 0) {
                    const error = new Error(
                        'You need at least one monitor to update an incident SLA'
                    );
                    error.code = 400;
                    throw error;
                }

                if (!isArrayUnique(data.monitors)) {
                    const error = new Error(
                        'You cannot have multiple selection of a monitor'
                    );
                    error.code = 400;
                    throw error;
                }

                // reassign data.monitors to match schema design
                data.monitors = data.monitors.map(monitor => ({
                    monitorId: monitor,
                }));

                const incidentCommunicationSla = await this.findOneBy({
                    name: data.name,
                    projectId: query.projectId,
                });

                if (
                    incidentCommunicationSla &&
                    String(incidentCommunicationSla._id) !== String(query._id)
                ) {
                    const error = new Error(
                        'Incident communication SLA with the same name already exist'
                    );
                    error.code = 400;
                    throw error;
                }
            }

            let incidentSla;
            if (data.isDefault) {
                incidentSla = await this.findOneBy({
                    projectId: query.projectId,
                    isDefault: true,
                });
            }

            if (incidentSla && String(incidentSla._id) !== String(query._id)) {
                await IncidentCommunicationSlaModel.findOneAndUpdate(
                    { _id: incidentSla._id },
                    { $set: { isDefault: false } }
                );
            }

            let updatedIncidentCommunicationSla = await IncidentCommunicationSlaModel.findOneAndUpdate(
                query,
                {
                    $set: data,
                },
                { new: true }
            );

            if (!updatedIncidentCommunicationSla) {
                const error = new Error(
                    'Incident Communication SLA not found or does not exist'
                );
                error.code = 400;
                throw error;
            }

            updatedIncidentCommunicationSla = await updatedIncidentCommunicationSla
                .populate('projectId')
                .populate('monitors.monitorId')
                .execPopulate();

            return updatedIncidentCommunicationSla;
        } catch (error) {
            ErrorService.log(
                'incidentCommunicationSlaService.updateOneBy',
                error
            );
            throw error;
        }
    },
    deleteBy: async function(query) {
        try {
            const deletedSla = await IncidentCommunicationSlaModel.findOneAndUpdate(
                query,
                {
                    $set: {
                        deleted: true,
                        deletedAt: Date.now(),
                    },
                },
                { new: true }
            );

            return deletedSla;
        } catch (error) {
            ErrorService.log('incidentCommunicationSlaService.deleteBy', error);
            throw error;
        }
    },
    hardDelete: async function(query) {
        try {
            await IncidentCommunicationSlaModel.deleteMany(query);
            return 'Incident Communication SLA(s) deleted successfully';
        } catch (error) {
            ErrorService.log(
                'incidentCommunicationSlaService.hardDelete',
                error
            );
            throw error;
        }
    },
    async countBy(query) {
        try {
            if (!query) {
                query = {};
            }

            if (!query.deleted) query.deleted = false;
            const count = await IncidentCommunicationSlaModel.countDocuments(
                query
            );
            return count;
        } catch (error) {
            ErrorService.log('incidentCommunicationSlaService.countBy', error);
            throw error;
        }
    },
};