import React, { Component } from 'react';
import { Translate } from 'react-auto-translate';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { translateLanguage } from '../actions/status';

import { openLanguageMenu } from '../actions/subscribe';

import ClickOutHandler from 'react-onclickout';

class LanguageBox extends Component {
    constructor(props) {
        super(props);
        this.translateButton = this.translateButton.bind(this);
        this.state = {
            language: 'english',
        };
    }
    translateButton = () => {
        if (this.props.theme) {
            this.props.handleCloseButtonClick();
        } else {
            this.props.openLanguageMenu();
        }
    };
    handleChange = event => {
        // eslint-disable-next-line no-console
        this.setState({
            ...this.state,
            language: event.target.value,
        });
    };
    handleTranslate = () => {
        this.props.translateLanguage(this.state.language);
        this.props.openLanguageMenu();
    };
    render() {
        const { statusPage } = this.props;
        const languages = statusPage.multipleLanguages;
        const theme = this.props.theme;
        return (
            <div className="subscribe-overlay">
                <ClickOutHandler
                    onClickOut={() => this.props.openLanguageMenu()}
                >
                    <div
                        className={
                            !theme
                                ? 'white box subscribe-box'
                                : 'bs-theme-shadow'
                        }
                        style={{
                            height: 'auto',
                            width: '300px',
                            marginLeft: theme && '-100px',
                        }}
                    >
                        <div
                            className="btn-group"
                            style={{
                                background: '#fff',
                                //justifyContent: 'flex-end',
                            }}
                        >
                            <button
                                id="updates-dropdown-atom-btn"
                                style={{
                                    cursor: 'default',
                                    background: '#fff',
                                }}
                                className="icon-container"
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        //justifyContent: 'center',
                                        alignItems: 'center',
                                        marginLeft: 15,
                                    }}
                                    className="title-wrapper"
                                >
                                    <span
                                        className="title"
                                        style={{
                                            fontSize: 16,
                                        }}
                                    >
                                        Choose Language
                                    </span>
                                </div>
                            </button>

                            <button
                                id="updates-dropdown-close-btn"
                                onClick={() => this.translateButton()}
                                className="icon-container"
                                style={{
                                    width: '70px',
                                    background: '#fff',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <span className="sub-icon icon-close"></span>
                                </div>
                            </button>
                        </div>
                        <div
                            className={
                                theme
                                    ? 'subscribe-box-inner bs-new-bg'
                                    : 'subscribe-box-inner'
                            }
                            style={{ paddingTop: 0 }}
                        >
                            <select
                                value={this.state.language}
                                onChange={this.handleChange}
                                name="country"
                                className="select-full"
                            >
                                {languages.map(language => (
                                    <option
                                        value={language.toLowerCase()}
                                        key={language}
                                    >
                                        {language}
                                    </option>
                                ))}
                            </select>
                            <div style={{ marginTop: 10 }}>
                                <button
                                    className={
                                        this.props.theme
                                            ? 'subscribe-btn-full bs-theme-btn'
                                            : 'subscribe-btn-full'
                                    }
                                    id="subscribe-btn-sms"
                                    onClick={() => this.handleTranslate()}
                                >
                                    <Translate>Translate Page</Translate>
                                </button>
                            </div>
                        </div>
                    </div>
                </ClickOutHandler>
            </div>
        );
    }
}

LanguageBox.displayName = 'LanguageBox';

const mapStateToProps = state => ({
    select: state.subscribe.selectedMenu,
    subscribed: state.subscribe.subscribed,
    statusPage: state.status.statusPage,
});

const mapDispatchToProps = dispatch =>
    bindActionCreators({ openLanguageMenu, translateLanguage }, dispatch);

LanguageBox.propTypes = {
    statusPage: PropTypes.object,
    theme: PropTypes.bool,
    handleCloseButtonClick: PropTypes.func,
    translateLanguage: PropTypes.func,
    openLanguageMenu: PropTypes.func,
};

export default connect(mapStateToProps, mapDispatchToProps)(LanguageBox);