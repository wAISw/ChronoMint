import {
  PROFILE_SIDE_PANEL_KEY,
} from 'components/common/SideStack/SideStack'
import ProfileContent from 'layouts/partials/ProfileContent/ProfileContent'
import MenuTokenMoreInfo, {
  PANEL_KEY,
} from 'layouts/partials/DrawerMainMenu/MenuTokenMoreInfo/MenuTokenMoreInfo'
import * as actions from './actions'

const initialState = {
  isProfilePanelOpen: false,
  stack: [{
    component: ProfileContent,
    panelKey: PROFILE_SIDE_PANEL_KEY,
    isOpened: false,
    direction: 'right',
  },
  {
    component: MenuTokenMoreInfo,
    panelKey: PANEL_KEY,
    isOpened: false,
    direction: 'left',
  },
  ],
}

export default (state = initialState, action) => {
  switch (action.type) {
    case actions.SIDES_PUSH:
      const filteredStack = state.stack.filter((panel) => panel.panelKey !== action.panelKey)
      return {
        ...state,
        stack: [...filteredStack, {
          panelKey: action.panelKey,
          component: action.component,
          componentProps: action.componentProps,
          isOpened: action.isOpened,
          direction: action.direction,
        }],
      }
    case actions.SIDES_POP:
      return {
        ...state,
        stack: state.stack.filter((panel) => panel.panelKey !== action.panelKey),
      }
    case actions.SIDES_CLEAR:
      return {
        ...state,
        stack: [],
      }
    default:
      return state
  }
}
