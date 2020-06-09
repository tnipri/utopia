/** @jsx jsx */
import * as React from 'react'
import { jsx } from '@emotion/core'
import { ControlProps, GenericControlOptions } from './control'
import { Icn, IcnProps } from 'uuiui'
import { Tooltip } from 'uuiui'
import { focusTextEditorIfPresent } from '../../editor/text-editor'
import { ControlStyleDefaults } from '../common/control-status'
import { UtopiaTheme } from 'uuiui'

export interface OptionControlOptions extends GenericControlOptions {
  icon?: IcnProps
  labelInner?: string
  tooltip?: string
  roundCorners?:
    | 'right'
    | 'left'
    | 'top'
    | 'bottom'
    | 'topLeft'
    | 'topRight'
    | 'bottomRight'
    | 'bottomLeft'
    | 'none'
    | 'all'
  width?: number
  height?: number
}

export const OptionControl: React.FunctionComponent<
  ControlProps<boolean> & {
    className?: string
  }
> = (props) => {
  const isChecked = props.value
  const propsOnSubmitValue = props.onSubmitValue
  const onSubmitValue = React.useCallback(() => {
    propsOnSubmitValue(!isChecked)
    focusTextEditorIfPresent()
  }, [propsOnSubmitValue, isChecked])

  const controlOptions: OptionControlOptions = {
    width: UtopiaTheme.layout.inputHeight.default,
    height: UtopiaTheme.layout.inputHeight.default,
    ...(props.controlOptions as OptionControlOptions),
  }

  let controlOpacity: number
  if (props.controlStyles.isSet) {
    if (props.value) {
      controlOpacity = UtopiaTheme.styles.inspectorSetSelectedOpacity
    } else {
      controlOpacity = UtopiaTheme.styles.inspectorUnsetSelectedOpacity
    }
  } else {
    if (props.value) {
      controlOpacity = UtopiaTheme.styles.inspectorSetUnselectedOpacity
    } else {
      controlOpacity = UtopiaTheme.styles.inspectorUnsetUnselectedOpacity
    }
  }

  const rc = controlOptions.roundCorners
  return (
    <div
      className={`${
        props.className != null ? props.className : ''
      } option-control-container segment`}
      style={{
        flex: '1',
        ...props.style,
      }}
    >
      <Tooltip
        disabled={controlOptions.tooltip == null}
        title={controlOptions.tooltip != null ? controlOptions.tooltip : ''}
        placement={'top'}
      >
        <label
          css={{
            // If just an option control:
            boxShadow: `0 0 0 1px ${props.controlStyles.borderColor} inset`,
            backgroundColor: ControlStyleDefaults.SetSegmentSelectorColor,
            borderRadius: rc != null ? 0 : UtopiaTheme.inputBorderRadius,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
            padding: '0 2px',
            textAlign: 'center',
            minWidth: controlOptions.width,
            height: controlOptions.height,
            color: props.controlStyles.mainColor,
            borderTopRightRadius:
              rc === 'all' || rc === 'right' || rc === 'topRight' || rc === 'top'
                ? UtopiaTheme.inputBorderRadius
                : undefined,
            borderBottomRightRadius:
              rc === 'all' || rc === 'right' || rc === 'bottomRight' || rc === 'bottom'
                ? UtopiaTheme.inputBorderRadius
                : undefined,
            borderTopLeftRadius:
              rc === 'all' || rc === 'left' || rc === 'topLeft' || rc === 'top'
                ? UtopiaTheme.inputBorderRadius
                : undefined,
            borderBottomLeftRadius:
              rc === 'all' || rc === 'left' || rc === 'bottomLeft' || rc === 'bottom'
                ? UtopiaTheme.inputBorderRadius
                : undefined,
            opacity: controlOpacity,
            '&:hover': {
              opacity: props.controlStatus == 'disabled' ? undefined : controlOpacity + 0.2,
            },
            '&:active': {
              opacity: props.controlStatus == 'disabled' ? undefined : 1,
            },
          }}
          className={`option-control ${
            props.controlClassName != null ? props.controlClassName : ''
          }`}
          onContextMenu={props.onContextMenu}
        >
          <input
            className='h0 w0 pa0 ma0'
            style={{ visibility: 'hidden', display: 'none' }}
            type='checkbox'
            checked={isChecked}
            disabled={!props.controlStyles.interactive}
            onChange={onSubmitValue}
          />
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {controlOptions.icon != null ? (
              <Icn
                style={{ marginRight: controlOptions.labelInner == null ? 0 : 4 }}
                {...controlOptions.icon}
              />
            ) : null}
            {controlOptions.labelInner != null ? controlOptions.labelInner : null}
          </div>
        </label>
      </Tooltip>
    </div>
  )
}
