import * as React from 'react'
import { isRight } from '../../../../../core/shared/either'
import {
  useWrappedSubmitFactoryEmptyOrUnknownOnSubmitValue,
  NumberInput,
  InspectorSubsectionHeader,
  FlexRow,
  SquareButton,
  Icn,
  CheckboxInput,
} from '../../../../../uuiui'
import { betterReactMemo } from '../../../../../uuiui-deps'
import { InspectorContextMenuWrapper } from '../../../../context-menu-wrapper'
import { addOnUnsetValues } from '../../../common/context-menu-items'
import {
  CSSBorder,
  CSSColor,
  cssKeyword,
  cssLineStyle,
  cssLineWidth,
  CSSNumber,
  defaultBorderWidth,
  defaultCSSBorder,
  EmptyInputValue,
  isCSSNumber,
  isCSSUnknownFunctionParameters,
  isEmptyInputValue,
  parseColor,
} from '../../../common/css-utils'
import { useGetSubsectionHeaderStyle } from '../../../common/inspector-utils'
import { useInspectorStyleInfo, useIsSubSectionVisible } from '../../../common/property-path-hooks'
import { ColorControl, StringColorControl } from '../../../controls/color-control'
import { FakeUnknownArrayItem } from '../../../controls/unknown-array-item'
import { UIGridRow } from '../../../widgets/ui-grid-row'

export function toggleBorderEnabled(_: null, oldValue: CSSBorder): CSSBorder {
  const valueIsEnabled = (oldValue.style?.value.value ?? 'none') !== 'none'
  if (valueIsEnabled) {
    let workingNewValue = { ...oldValue }
    delete workingNewValue.style
    return workingNewValue
  } else {
    return {
      ...oldValue,
      style: cssLineStyle(cssKeyword('solid')),
    }
  }
}

export function updateBorderWidth(
  newWidth: CSSNumber | EmptyInputValue,
  oldValue: CSSBorder,
): CSSBorder {
  if (isEmptyInputValue(newWidth)) {
    let newValue = {
      ...oldValue,
    }
    delete newValue.width
    return newValue
  } else {
    return {
      ...oldValue,
      style:
        (oldValue.style?.value.value ?? 'none') === 'none'
          ? cssLineStyle(cssKeyword('solid'))
          : oldValue.style,
      width: cssLineWidth(newWidth),
    }
  }
}

export function updateBorderColor(newColor: CSSColor, oldValue: CSSBorder): CSSBorder {
  return {
    ...oldValue,
    style:
      (oldValue.style?.value.value ?? 'none') === 'none'
        ? cssLineStyle(cssKeyword('solid'))
        : oldValue.style,
    color: newColor,
  }
}

export function updateBorderColorString(newValue: string, oldValue: CSSBorder): CSSBorder {
  const parsed = parseColor(newValue)
  if (isRight(parsed)) {
    return updateBorderColor(parsed.value, oldValue)
  } else {
    return oldValue
  }
}

function insertBorder(_: null, oldValue: CSSBorder): CSSBorder {
  return { ...defaultCSSBorder }
}

export const BorderSubsection: React.FunctionComponent = betterReactMemo('BorderSubsection', () => {
  const isVisible = useIsSubSectionVisible('border')

  const {
    value,
    controlStatus,
    controlStyles,
    propertyStatus,
    onUnsetValues,
    useSubmitValueFactory,
  } = useInspectorStyleInfo('border')

  const headerStyle = useGetSubsectionHeaderStyle(controlStatus)

  const borderEnabled = (value.style?.value.value ?? 'none') !== 'none'
  const borderColor: CSSColor = value.color ?? defaultCSSBorder.color
  const borderWidth: CSSNumber = (() => {
    if (value.width == null) {
      return { ...defaultBorderWidth }
    } else if (isCSSNumber(value.width.value)) {
      return value.width.value
    } else {
      // TODO: CSSKeyword support in number controls
      return { ...defaultBorderWidth }
    }
  })()

  const [borderEnabledSubmitValue] = useSubmitValueFactory(toggleBorderEnabled)
  const onCheckboxChange = React.useCallback(() => {
    borderEnabledSubmitValue(null)
  }, [borderEnabledSubmitValue])

  const [onInsertBorderSubmitValue] = useSubmitValueFactory(insertBorder)
  const onInsertMouseDown = React.useCallback(() => {
    onInsertBorderSubmitValue(null)
  }, [onInsertBorderSubmitValue])

  const [borderColorSubmitValue, borderColorTransientSubmitValue] = useSubmitValueFactory(
    updateBorderColor,
  )
  const [borderColorStringSubmitValue] = useSubmitValueFactory(updateBorderColorString)
  const [
    borderWidthSubmitValue,
    borderWidthTransientSubmitValue,
  ] = useWrappedSubmitFactoryEmptyOrUnknownOnSubmitValue(useSubmitValueFactory(updateBorderWidth))

  const allOrSplitControls = (
    <UIGridRow tall alignItems='start' padded={false} type='<-------1fr------>|----80px----|'>
      <StringColorControl
        id='border-color'
        key='border-color'
        testId='border-color'
        value={borderColor}
        onSubmitValue={borderColorSubmitValue}
        onTransientSubmitValue={borderColorTransientSubmitValue}
        onSubmitSolidStringValue={borderColorStringSubmitValue}
        pickerOffset={{ x: -45, y: 0 }}
        controlStatus={controlStatus}
        controlStyles={controlStyles}
      />
      <NumberInput
        id='border-width'
        testId='border-width'
        value={borderWidth}
        DEPRECATED_labelBelow='width'
        minimum={0}
        onSubmitValue={borderWidthSubmitValue}
        onTransientSubmitValue={borderWidthTransientSubmitValue}
        controlStatus={controlStatus}
        numberType='Length'
        defaultUnitToHide={'px'}
      />
    </UIGridRow>
  )

  const borderSet: boolean = controlStatus !== 'unset'

  const contextMenuItems = [addOnUnsetValues(['border parameters'], onUnsetValues)]

  if (!isVisible) {
    return null
  }
  return (
    <InspectorContextMenuWrapper
      id='border-subsection-context-menu'
      items={contextMenuItems}
      data={null}
    >
      <InspectorSubsectionHeader style={headerStyle}>
        <FlexRow
          style={{
            flexGrow: 1,
          }}
        >
          Border
        </FlexRow>
        {propertyStatus.overwritable ? (
          <SquareButton highlight onMouseDown={onInsertMouseDown} disabled={borderSet}>
            <Icn
              style={{ paddingTop: 1 }}
              category='semantic'
              type='plus'
              color={propertyStatus.controlled ? 'blue' : 'darkgray'}
              width={16}
              height={16}
            />
          </SquareButton>
        ) : null}
      </InspectorSubsectionHeader>

      {borderSet ? (
        isCSSUnknownFunctionParameters(value) ? (
          <FakeUnknownArrayItem controlStatus={controlStatus} />
        ) : (
          <UIGridRow tall alignItems='start' padded={true} type='<---1fr--->|------172px-------|'>
            <UIGridRow
              tall
              alignItems='start'
              padded={false}
              type='<-auto-><----------1fr--------->'
            >
              <CheckboxInput
                id={`shadow-enable-disable`}
                key={`shadow-enable-disable`}
                checked={borderEnabled}
                onChange={onCheckboxChange}
                controlStatus={controlStatus}
              />
              <ColorControl
                id='border-color'
                key='border-color'
                testId='border-color'
                value={borderColor}
                onSubmitValue={borderColorSubmitValue}
                onTransientSubmitValue={borderColorTransientSubmitValue}
                onSubmitSolidStringValue={borderColorStringSubmitValue}
                pickerOffset={{ x: -45, y: 0 }}
                controlStatus={controlStatus}
                controlStyles={controlStyles}
              />
            </UIGridRow>
            {allOrSplitControls}
          </UIGridRow>
        )
      ) : null}
    </InspectorContextMenuWrapper>
  )
})
BorderSubsection.displayName = 'BorderSubsection'
