import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { reduxForm, Field } from 'redux-form';
import { closeModal } from '../../actions/modal';
import ShouldRender from '../basic/ShouldRender';
import { FormLoader } from '../basic/Loader';
import { RenderField } from '../basic/RenderField';
import { RenderSelect } from '../basic/RenderSelect';
import {
    createCustomField,
    fetchCustomFields,
} from '../../actions/customField';

function validate(values) {
    const errors = {};

    if (!values.fieldName) {
        errors.fieldName = 'Field name is required';
    }
    return errors;
}

class CreateCustomField extends React.Component {
    componentDidMount() {
        window.addEventListener('keydown', this.handleKeyBoard);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleKeyBoard);
    }

    submitForm = values => {
        const {
            closeModal,
            createCustomFieldModalId,
            data,
            createCustomField,
            fetchCustomFields,
        } = this.props;
        const projectId = data.projectId;
        const postObj = {
            fieldName: values.fieldName,
            fieldType: values.fieldType,
        };

        createCustomField(projectId, postObj).then(() => {
            if (!this.props.createFieldError) {
                fetchCustomFields(projectId, 0, 10);
                closeModal({
                    id: createCustomFieldModalId,
                });
            }
        });
    };

    handleKeyBoard = e => {
        switch (e.key) {
            case 'Escape':
                return this.props.closeModal({
                    id: this.props.createCustomFieldModalId,
                });
            case 'Enter':
                return document
                    .getElementById('createCustomFieldButton')
                    .click();
            default:
                return false;
        }
    };

    render() {
        const {
            requesting,
            createFieldError,
            closeModal,
            handleSubmit,
        } = this.props;

        return (
            <div
                className="ModalLayer-contents"
                tabIndex="-1"
                style={{ marginTop: '40px' }}
            >
                <div className="bs-BIM">
                    <div className="bs-Modal" style={{ width: 600 }}>
                        <div className="bs-Modal-header">
                            <div
                                className="bs-Modal-header-copy"
                                style={{
                                    marginBottom: '10px',
                                    marginTop: '10px',
                                }}
                            >
                                <span className="Text-color--inherit Text-display--inline Text-fontSize--20 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                    <span>Create Custom Field</span>
                                </span>
                            </div>
                        </div>
                        <form
                            id="customFieldForm"
                            onSubmit={handleSubmit(this.submitForm)}
                        >
                            <div className="bs-Modal-content">
                                <div className="bs-Fieldset-wrapper Box-root Margin-bottom--2">
                                    <fieldset className="Margin-bottom--16">
                                        <div className="bs-Fieldset-rows">
                                            <div
                                                className="bs-Fieldset-row"
                                                style={{ padding: 0 }}
                                            >
                                                <label
                                                    className="bs-Fieldset-label Text-align--left"
                                                    htmlFor="fieldName"
                                                >
                                                    <span>Field Name</span>
                                                </label>
                                                <div className="bs-Fieldset-fields">
                                                    <div
                                                        className="bs-Fieldset-field"
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                    >
                                                        <Field
                                                            component={
                                                                RenderField
                                                            }
                                                            name="fieldName"
                                                            placeholder="Field name"
                                                            id="fieldName"
                                                            className="bs-TextInput"
                                                            style={{
                                                                width: '100%',
                                                                padding:
                                                                    '3px 5px',
                                                            }}
                                                            autoFocus={true}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>
                                    <fieldset className="Margin-bottom--16">
                                        <div className="bs-Fieldset-rows">
                                            <div
                                                className="bs-Fieldset-row"
                                                style={{ padding: 0 }}
                                            >
                                                <label
                                                    className="bs-Fieldset-label Text-align--left"
                                                    htmlFor="fieldType"
                                                >
                                                    <span>Field Type</span>
                                                </label>
                                                <div className="bs-Fieldset-fields">
                                                    <div
                                                        className="bs-Fieldset-field"
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                    >
                                                        <Field
                                                            className="db-select-nw Table-cell--width--maximized"
                                                            component={
                                                                RenderSelect
                                                            }
                                                            name="fieldType"
                                                            id="fieldType"
                                                            placeholder="Field type"
                                                            style={{
                                                                height: '28px',
                                                                width: '100%',
                                                            }}
                                                            options={[
                                                                {
                                                                    value: '',
                                                                    label:
                                                                        'Select field type',
                                                                },
                                                                {
                                                                    value:
                                                                        'text',
                                                                    label:
                                                                        'Text',
                                                                },
                                                                {
                                                                    value:
                                                                        'number',
                                                                    label:
                                                                        'Number',
                                                                },
                                                            ]}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>
                                </div>
                            </div>
                            <div className="bs-Modal-footer">
                                <div className="bs-Modal-footer-actions">
                                    <ShouldRender if={createFieldError}>
                                        <div className="bs-Tail-copy">
                                            <div
                                                className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--row Flex-justifyContent--flexStart"
                                                style={{ marginTop: '10px' }}
                                            >
                                                <div className="Box-root Margin-right--8">
                                                    <div className="Icon Icon--info Icon--color--red Icon--size--14 Box-root Flex-flex"></div>
                                                </div>
                                                <div className="Box-root">
                                                    <span
                                                        style={{ color: 'red' }}
                                                    >
                                                        {createFieldError}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </ShouldRender>
                                    <button
                                        className="bs-Button bs-DeprecatedButton btn__modal"
                                        type="button"
                                        onClick={() =>
                                            closeModal({
                                                id: this.props
                                                    .createCustomFieldModalId,
                                            })
                                        }
                                    >
                                        <span>Cancel</span>
                                        <span className="cancel-btn__keycode">
                                            Esc
                                        </span>
                                    </button>
                                    <button
                                        id="createCustomFieldButton"
                                        className="bs-Button bs-DeprecatedButton bs-Button--blue btn__modal"
                                        disabled={requesting}
                                        type="submit"
                                    >
                                        {!requesting && (
                                            <>
                                                <span>Create</span>
                                                <span className="create-btn__keycode">
                                                    <span className="keycode__icon keycode__icon--enter" />
                                                </span>
                                            </>
                                        )}
                                        {requesting && <FormLoader />}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

CreateCustomField.displayName = 'CreateCustomField';

CreateCustomField.propTypes = {
    closeModal: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    createCustomField: PropTypes.func.isRequired,
    fetchCustomFields: PropTypes.func.isRequired,
    createCustomFieldModalId: PropTypes.string,
    data: PropTypes.object,
    requesting: PropTypes.bool,
    createFieldError: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.oneOf([null, undefined]),
    ]),
};

const CreateCustomFieldForm = reduxForm({
    form: 'CreateCustomFieldForm',
    enableReinitialize: false,
    validate,
    destroyOnUnmount: true,
})(CreateCustomField);

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            createCustomField,
            fetchCustomFields,
            closeModal,
        },
        dispatch
    );

const mapStateToProps = state => {
    return {
        requesting: state.customField.customField.requesting,
        createFieldError: state.customField.customField.error,
        createCustomFieldModalId: state.modal.modals[0].id,
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(CreateCustomFieldForm);