import * as React from 'react'
import { MenuIcons, SimpleFlexRow, Tooltip } from '../../uuiui'
import { RightMenuTile } from '../canvas/right-menu'
import { useEditorState } from './store/store-hook'
import * as EditorActions from '../editor/actions/action-creators'
import { betterReactMemo } from '../../uuiui-deps'
import * as TP from '../../core/shared/template-path'
import { FormulaBar } from '../canvas/controls/formula-bar'

export const TopMenu = betterReactMemo('TopMenu', () => {
  const dispatch = useEditorState((store) => store.dispatch, 'TopMenu dispatch')
  const navigatorPosition = useEditorState(
    (store) => store.editor.navigator.position,
    'TopMenu navigatorPosition',
  )

  const onClickNavigateTab = React.useCallback(() => {
    dispatch([EditorActions.togglePanel('navigatorPane')])
  }, [dispatch])

  const selectedViews = useEditorState(
    (store) => store.editor.selectedViews,
    'TopMenu selectedViews',
  )
  const formulaBarKey = selectedViews.map(TP.toString).join(',')

  return (
    <SimpleFlexRow style={{ flexGrow: 1 }}>
      <Tooltip title={'Toggle outline'} placement={'bottom'}>
        <RightMenuTile
          selected={navigatorPosition !== 'hidden'}
          highlightSelected={false}
          icon={<MenuIcons.Navigator />}
          onClick={onClickNavigateTab}
        />
      </Tooltip>
      <FormulaBar key={formulaBarKey} />
    </SimpleFlexRow>
  )
})