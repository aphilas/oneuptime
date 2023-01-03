import Route from 'Common/Types/API/Route';
import { JSONObject } from 'Common/Types/JSON';
import Button, { ButtonStyleType } from 'CommonUI/src/Components/Button/Button';
import { IconProp } from 'CommonUI/src/Components/Icon/Icon';
import ModelTable from 'CommonUI/src/Components/ModelTable/ModelTable';
import Page from 'CommonUI/src/Components/Page/Page';
import Navigation from 'CommonUI/src/Utils/Navigation';
import React, { FunctionComponent, ReactElement, useState } from 'react';
import Text from 'Common/Types/Text';
import PageMap from '../../Utils/PageMap';
import RouteMap from '../../Utils/RouteMap';
import PageComponentProps from '../PageComponentProps';
import DashboardSideMenu from './SideMenu';
import BillingInvoice from 'Model/Models/BillingInvoice';
import FieldType from 'CommonUI/src/Components/Types/FieldType';
import URL from 'Common/Types/API/URL';
import Pill from 'CommonUI/src/Components/Pill/Pill';
import { Green, Yellow } from 'Common/Types/BrandColors';
import { DASHBOARD_API_URL } from 'CommonUI/src/Config';
import BaseAPI from 'CommonUI/src/Utils/API/API';
import ModelAPI from 'CommonUI/src/Utils/ModelAPI/ModelAPI';
import HTTPErrorResponse from 'Common/Types/API/HTTPErrorResponse';
import ConfirmModal from 'CommonUI/src/Components/Modal/ConfirmModal';
import ComponentLoader from 'CommonUI/src/Components/ComponentLoader/ComponentLoader';

export interface ComponentProps extends PageComponentProps {}

const Settings: FunctionComponent<ComponentProps> = (
    props: ComponentProps
): ReactElement => {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const payInvoice: Function = async (
        customerId: string,
        invoiceId: string
    ): Promise<void> => {
        try {
            setIsLoading(true);

            await BaseAPI.post<JSONObject>(
                URL.fromString(DASHBOARD_API_URL.toString()).addRoute(
                    `/billing-invoices/pay`
                ),
                {
                    data: {
                        paymentProviderInvoiceId: invoiceId,
                        paymentProviderCustomerId: customerId,
                    },
                },
                ModelAPI.getCommonHeaders()
            );

            Navigation.reload();
        } catch (err) {
            try {
                setError(
                    (err as HTTPErrorResponse).message ||
                        'Server Error. Please try again'
                );
            } catch (e) {
                setError('Server Error. Please try again');
            }
            setIsLoading(false);
        }
    };

    return (
        <Page
            title={'Project Settings'}
            breadcrumbLinks={[
                {
                    title: 'Project',
                    to: RouteMap[PageMap.HOME] as Route,
                },
                {
                    title: 'Settings',
                    to: RouteMap[PageMap.SETTINGS] as Route,
                },
                {
                    title: 'Invoices',
                    to: RouteMap[PageMap.SETTINGS_BILLING_INVOICES] as Route,
                },
            ]}
            sideMenu={<DashboardSideMenu />}
        >
            {isLoading ? <ComponentLoader /> : <></>}

            {!isLoading ? (
                <ModelTable<BillingInvoice>
                    modelType={BillingInvoice}
                    id="invoices-table"
                    isDeleteable={false}
                    name="Settings > Billing > Invoices"
                    isEditable={false}
                    isCreateable={false}
                    isViewable={false}
                    cardProps={{
                        icon: IconProp.File,
                        title: 'Invoices',
                        description:
                            'Here is a list of invoices for this project.',
                    }}
                    noItemsMessage={'No invoices so far.'}
                    query={{
                        projectId: props.currentProject?._id,
                    }}
                    showRefreshButton={true}
                    showFilterButton={false}
                    selectMoreFields={{
                        currencyCode: true,
                        paymentProviderCustomerId: true,
                    }}
                    columns={[
                        {
                            field: {
                                paymentProviderInvoiceId: true,
                            },
                            title: 'Invoice ID',
                            type: FieldType.Text,
                        },
                        {
                            field: {
                                amount: true,
                            },
                            title: 'Amount',
                            type: FieldType.Text,
                            isFilterable: true,
                            getElement: (item: JSONObject) => {
                                return (
                                    <span>{`${
                                        (item['amount'] as number) / 100
                                    } ${item['currencyCode']
                                        ?.toString()
                                        .toUpperCase()}`}</span>
                                );
                            },
                        },
                        {
                            field: {
                                status: true,
                            },
                            title: 'Invoice Status',
                            type: FieldType.Text,
                            isFilterable: true,
                            getElement: (item: JSONObject) => {
                                if (item['status'] === 'paid') {
                                    return (
                                        <Pill
                                            text={Text.uppercaseFirstLetter(
                                                item['status'] as string
                                            )}
                                            color={Green}
                                        />
                                    );
                                }
                                return (
                                    <Pill
                                        text={Text.uppercaseFirstLetter(
                                            item['status'] as string
                                        )}
                                        color={Yellow}
                                    />
                                );
                            },
                        },
                        {
                            field: {
                                downloadableLink: true,
                            },
                            title: 'Actions',
                            type: FieldType.Text,
                            isFilterable: true,
                            getElement: (item: JSONObject) => {
                                return (
                                    <div>
                                        {item['downloadableLink'] ? (
                                            <Button
                                                icon={IconProp.Download}
                                                onClick={() => {
                                                    Navigation.navigate(
                                                        item[
                                                            'downloadableLink'
                                                        ] as URL
                                                    );
                                                }}
                                                title="Download"
                                            />
                                        ) : (
                                            <></>
                                        )}

                                        {item['status'] !== 'paid' &&
                                        item['status'] !== 'draft' ? (
                                            <Button
                                                icon={IconProp.Billing}
                                                onClick={async () => {
                                                    await payInvoice(
                                                        item[
                                                            'paymentProviderCustomerId'
                                                        ] as string,
                                                        item[
                                                            'paymentProviderInvoiceId'
                                                        ] as string
                                                    );
                                                }}
                                                title="Pay Invoice"
                                            />
                                        ) : (
                                            <></>
                                        )}
                                    </div>
                                );
                            },
                        },
                    ]}
                />
            ) : (
                <></>
            )}

            {error ? (
                <ConfirmModal
                    title={`Error`}
                    description={`${error}`}
                    submitButtonText={'Close'}
                    onSubmit={() => {
                        setError('');
                    }}
                    submitButtonType={ButtonStyleType.NORMAL}
                />
            ) : (
                <></>
            )}
        </Page>
    );
};

export default Settings;