import AppDAO from '../../../dao/AppDAO';
import LOCsManagerDAO from '../../../dao/LOCsManagerDAO';
import { notify } from '../notifier/notifier';
import LOCNoticeModel, {ADDED, REMOVED, UPDATED} from '../../../models/notices/LOCNoticeModel';
import {LOCS_FETCH_START, LOCS_FETCH_END} from './communication';
import { createAllLOCsAction, createLOCAction, updateLOCAction , removeLOCAction } from './reducer';
import { showAlertModal } from '../ui/modal';

const locsLoadStartAction = () => ({type: LOCS_FETCH_START});
const locsLoadSuccessAction = (payload) => ({type: LOCS_FETCH_END, payload});

const updateLOC = (data, hideModal) => (dispatch) => {
    return LOCsManagerDAO.updateLOC(data, data.account).then( (r) => {
        if (r === true){
            hideModal();
        } else {
            dispatch(showAlertModal({title: 'Error', message: 'LOC not updated'}));
        }
    });
};

const issueLH = (data, hideModal) => (dispatch) => {
    const {account, issueAmount, locAddress, issued} = data;
    return AppDAO.reissueAsset('LHT', issueAmount, account, locAddress).then(r => {
        if (!r) {
            dispatch(showAlertModal({title: 'Error', message: 'LH not issued'}));
        }
        LOCsManagerDAO.updateLOC({issued, account, locAddress}, account);
        hideModal();
    });
};

const submitLOC = (data, hideModal) => (dispatch) => {
    if (!data.address) {
        return dispatch(proposeLOC(data, hideModal));
    } else {
        return dispatch(updateLOC(data, hideModal));
    }
};

const proposeLOC = (props, hideModal) => (dispatch) => {
    let {locName, website, issueLimit, publishedHash, expDate, account} = props;
    return LOCsManagerDAO.proposeLOC(locName, website, issueLimit, publishedHash, expDate, account).then(r => {
        if (!r) {
            dispatch(showAlertModal({title: 'Error', message: loc.name() + ' Not proposed'}));
        } else {
            hideModal();
        }
        return r;
    });
};

const removeLOC = (address, account, hideModal) => (dispatch) => {
    return LOCsManagerDAO.removeLOC(address, account).then(r => {
        if (!r) {
            dispatch(showAlertModal({title: 'Error', message: 'LOC not removed.'}));
        }
        hideModal();
    });
};

const handleNewLOC = (locModel, time) => (dispatch) => {
    dispatch(createLOCAction(locModel));
    dispatch(notify(new LOCNoticeModel({time, loc: locModel, action: ADDED})))
};

const handleRemoveLOC = (address, time) => (dispatch, getState) => {
    const loc = getState().get('locs').get(address);
    dispatch(removeLOCAction({address}));
    dispatch(notify(new LOCNoticeModel({time, loc, action: REMOVED})))
};

const handleUpdateLOCValue = (address, valueName, value, time) => (dispatch, getState) => {
    const loc = getState().get('locs').get(address);
    dispatch(updateLOCAction({valueName, value, address}));
    dispatch(notify(new LOCNoticeModel({time, loc, action: UPDATED, params: {valueName, value} })))
};

const getLOCs = (account) => (dispatch) => {
    dispatch(locsLoadStartAction());
    return LOCsManagerDAO.getLOCs(account).then( locs => {
        dispatch(createAllLOCsAction(locs));
        dispatch(locsLoadSuccessAction());
    });
};

export {
    submitLOC,
    issueLH,
    removeLOC,
    handleNewLOC,
    handleRemoveLOC,
    handleUpdateLOCValue,
    getLOCs
}