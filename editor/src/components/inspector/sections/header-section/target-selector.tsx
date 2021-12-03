/** @jsx jsx */
import { jsx } from '@emotion/react'
import styled from '@emotion/styled'
import React from 'react'
import { arrayEquals } from '../../../../core/shared/utils'
import { unless, when } from '../../../../utils/react-conditionals'
import Utils from '../../../../utils/utils'
import {
  FlexColumn,
  useColorTheme,
  FlexRow,
  UtopiaTheme,
  UtopiaStyles,
  StringInput,
  H1,
  SectionActionSheet,
  SquareButton,
  FunctionIcons,
  OnClickOutsideHOC,
  UIRow,
  H2,
  InspectorSubsectionHeader,
  Tooltip,
  UNSAFE_getIconURL,
} from '../../../../uuiui'
import { betterReactMemo, ContextMenuWrapper } from '../../../../uuiui-deps'
import { useEditorState } from '../../../editor/store/store-hook'
import { ExpandableIndicator } from '../../../navigator/navigator-item/expandable-indicator'

export type TargetSelectorLength = number | 'mixed'

export interface CSSTarget {
  path: Array<string>
  selectorLength: TargetSelectorLength
}

export function cssTarget(path: Array<string>, selectorLength: TargetSelectorLength) {
  return {
    path,
    selectorLength,
  }
}

interface TargetSelectorPanelProps {
  targets: Array<CSSTarget>
  selectedTargetPath: Array<string>
  onSelect: (targetPath: Array<string>) => void
  style?: React.CSSProperties
  onStyleSelectorRename: (renameTarget: CSSTarget, label: string) => void
  onStyleSelectorDelete: (deleteTarget: CSSTarget) => void
  onStyleSelectorInsert: (parent: CSSTarget, label: string) => void
}

export const TargetSelectorPanel = betterReactMemo(
  'TargetSelectorPanel',
  (props: TargetSelectorPanelProps) => {
    const colorTheme = useColorTheme()
    const {
      targets,
      onSelect,
      selectedTargetPath,
      onStyleSelectorRename,
      onStyleSelectorDelete,
      onStyleSelectorInsert,
    } = props
    const [addingIndex, setAddingIndex] = React.useState<number | null>(null)
    const [addingIndentLevel, setAddingIndentLevel] = React.useState<number | null>(null)
    const exitAdding = React.useCallback(() => {
      setAddingIndex(null)
      setAddingIndentLevel(null)
    }, [])

    const onRenameByIndex = React.useCallback(
      (index: number, label: string) => {
        onStyleSelectorRename(targets[index], label)
      },
      [targets, onStyleSelectorRename],
    )

    const [isOpen, setIsOpen] = React.useState<boolean>(false)

    const onDeleteByIndex = React.useCallback(
      (index: number) => onStyleSelectorDelete(targets[index]),
      [targets, onStyleSelectorDelete],
    )
    const onSelectByIndex = React.useCallback((index: number) => onSelect(targets[index].path), [
      targets,
      onSelect,
    ])
    const onInsertByIndex = React.useCallback(
      (index: number, label: string) => {
        onStyleSelectorInsert(targets[index], label)
      },
      [targets, onStyleSelectorInsert],
    )
    const targetIndex = getCSSTargetIndex(selectedTargetPath, targets)

    const slicedTargetsAdding = React.useMemo(() => targets.slice(0, addingIndex ?? undefined), [
      addingIndex,
      targets,
    ])

    const slicedTargets = React.useMemo(
      () => (addingIndex != null ? targets.slice(addingIndex, targets.length) : targets),
      [targets, addingIndex],
    )

    return (
      <FlexColumn
        style={{
          position: 'relative',
          paddingTop: '8px',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <TargetListHeader
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          setAddingIndex={setAddingIndex}
          selectedTargetPath={selectedTargetPath}
          isAdding={addingIndex != null}
          targetIndex={targetIndex}
        />
        {/* outer flexColumn takes a fixed height (or can grow to fill space, this way addable row can
      be at the top without being included in scrollable list */}
        {isOpen ? (
          <FlexColumn
            className='label-fixedHeightList'
            style={{ height: 100, overflowY: 'scroll' }}
          >
            <FlexColumn
              className='label-scrollableList'
              style={{
                borderTop: `1px solid ${colorTheme.secondaryBorder.value}`,
                borderBottom: `1px solid ${colorTheme.secondaryBorder.value}`,
                paddingTop: 5,
                paddingBottom: 8,
                backgroundColor: colorTheme.emphasizedBackground.value,
                flexGrow: 1,
                overflowY: 'scroll',
              }}
            >
              {addingIndex != null ? (
                <React.Fragment>
                  <TargetList
                    targets={slicedTargetsAdding}
                    selectionOffset={0}
                    selectedItemIndex={targetIndex}
                    setAddingIndex={setAddingIndex}
                    setAddingIndentLevel={setAddingIndentLevel}
                    onSelect={onSelectByIndex}
                    onRenameByIndex={onRenameByIndex}
                    onDeleteByIndex={onDeleteByIndex}
                  />
                  <AddingRow
                    onInsert={onInsertByIndex}
                    addingIndex={addingIndex}
                    addingIndentLevel={addingIndentLevel}
                    finishAdding={exitAdding}
                  />
                </React.Fragment>
              ) : null}
              <TargetList
                targets={slicedTargets}
                selectionOffset={addingIndex != null ? addingIndex : 0}
                selectedItemIndex={targetIndex}
                setAddingIndex={setAddingIndex}
                setAddingIndentLevel={setAddingIndentLevel}
                onSelect={onSelectByIndex}
                onRenameByIndex={onRenameByIndex}
                onDeleteByIndex={onDeleteByIndex}
              />
            </FlexColumn>
          </FlexColumn>
        ) : null}
        {unless(
          isOpen,
          <MiniTargetSelector
            targets={targets}
            selectedTargetPath={selectedTargetPath}
            onSelect={onSelect}
          />,
        )}
      </FlexColumn>
    )
  },
)

interface TargetListProps {
  targets: Array<CSSTarget>
  selectionOffset: number
  selectedItemIndex: number
  setAddingIndex: React.Dispatch<React.SetStateAction<number | null>>
  setAddingIndentLevel: React.Dispatch<React.SetStateAction<number | null>>
  onSelect: (index: number) => void
  onRenameByIndex: (index: number, label: string) => void
  onDeleteByIndex: (index: number) => void
}

const TargetList = betterReactMemo('TargetList', (props: TargetListProps) => {
  const {
    targets,
    selectionOffset,
    selectedItemIndex,
    setAddingIndex,
    setAddingIndentLevel,
    onSelect,
    onRenameByIndex,
    onDeleteByIndex,
  } = props

  return (
    <React.Fragment>
      {targets.map((target: CSSTarget, itemIndex: number) => (
        <TargetListItem
          id={`target-list-item-${itemIndex}`}
          key={`target-list-item-${itemIndex}`}
          itemIndex={itemIndex}
          target={target}
          selectionOffset={selectionOffset}
          selectedItemIndex={selectedItemIndex}
          onSelect={onSelect}
          setAddingIndex={setAddingIndex}
          setAddingIndentLevel={setAddingIndentLevel}
          onRenameByIndex={onRenameByIndex}
          onDeleteByIndex={onDeleteByIndex}
        />
      ))}
    </React.Fragment>
  )
})

interface TargetListItemProps {
  itemIndex: number
  target: CSSTarget
  selectionOffset: number
  selectedItemIndex: number
  onSelect: (index: number) => void
  setAddingIndex: React.Dispatch<React.SetStateAction<number | null>>
  setAddingIndentLevel: React.Dispatch<React.SetStateAction<number | null>>
  id: string
  onRenameByIndex: (index: number, label: string) => void
  onDeleteByIndex: (index: number) => void
}
TargetList.displayName = 'TargetList'

const TargetListItem = betterReactMemo('TargetListItem', (props: TargetListItemProps) => {
  const colorTheme = useColorTheme()
  const {
    itemIndex,
    target,
    selectionOffset,
    selectedItemIndex,
    onSelect,
    setAddingIndex,
    setAddingIndentLevel,
    id,
    onRenameByIndex,
    onDeleteByIndex,
  } = props
  const fixedItemIndex = itemIndex + selectionOffset
  const itemLabel = getCSSTargetLabel(target)

  const [itemBeingRenamedId, setItemBeingRenamedId] = React.useState<number | null>(null)
  const [renameValue, setRenameValue] = React.useState<string | null>(null)

  const { dispatch } = useEditorState(
    (store) => ({
      dispatch: store.dispatch,
    }),
    'TargetListItem',
  )

  const startRename = React.useCallback(() => {
    setItemBeingRenamedId(fixedItemIndex)
    setRenameValue(itemLabel)
  }, [fixedItemIndex, itemLabel, setItemBeingRenamedId, setRenameValue])

  const clearRenameState = React.useCallback(() => {
    setItemBeingRenamedId(null)
    setRenameValue(null)
  }, [setItemBeingRenamedId, setRenameValue])

  const onRenameKeydown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && itemBeingRenamedId != null && renameValue != null) {
        onRenameByIndex(itemBeingRenamedId, renameValue)
        clearRenameState()
      } else if (event.key === 'Escape') {
        clearRenameState()
      }
    },
    [clearRenameState, itemBeingRenamedId, renameValue, onRenameByIndex],
  )

  const onRenameChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRenameValue(event.target.value)
    },
    [setRenameValue],
  )

  const isSelected = fixedItemIndex === selectedItemIndex

  const onSelectByMouseCallback = React.useCallback(() => {
    onSelect(fixedItemIndex)
  }, [fixedItemIndex, onSelect])
  const onSelectByEnterCallback = React.useCallback(
    (e) => {
      if (e.buttons === 1) {
        onSelect(fixedItemIndex)
      }
    },
    [fixedItemIndex, onSelect],
  )
  const setAddingStateCallback = React.useCallback(() => {
    setAddingIndex(fixedItemIndex + 1)
    setAddingIndentLevel(target.path.length)
  }, [fixedItemIndex, setAddingIndex, setAddingIndentLevel, target.path.length])

  const deleteCurrentItem = React.useCallback(() => {
    onDeleteByIndex(itemIndex)
  }, [onDeleteByIndex, itemIndex])

  return (
    <ContextMenuWrapper
      id={`${id}-contextMenu`}
      items={[
        {
          name: 'Add nested selector',
          enabled: true,
          action: () => {
            setAddingStateCallback()
          },
        },
        {
          name: 'Rename',
          enabled: true,
          action: () => {
            startRename()
          },
        },
        {
          name: 'Delete',
          enabled: true,
          action: deleteCurrentItem,
        },
      ]}
      data={null}
      dispatch={dispatch}
    >
      <UIRow
        tabIndex={0}
        style={{
          height: 32,
          flexShrink: 0,
          position: 'relative',
          marginLeft: 5,
          marginRight: 5,
          marginTop: 1,
          marginBottom: 1,
          paddingLeft: 8 + 10 * (target.path.length - 1),
          paddingRight: 12,
          borderRadius: UtopiaTheme.inputBorderRadius,

          fontWeight: isSelected ? 600 : 400,
          fontStyle: target.selectorLength > 0 ? undefined : 'italic',
          backgroundImage: isSelected ? UtopiaStyles.backgrounds.blue : undefined,
          color: isSelected
            ? colorTheme.white.value
            : colorTheme.neutralForeground.o(target.selectorLength > 0 ? 100 : 40).value,
        }}
        onDoubleClick={startRename}
        onMouseDown={onSelectByMouseCallback}
        onMouseEnter={onSelectByEnterCallback}
      >
        {fixedItemIndex === itemBeingRenamedId ? (
          <StringInput
            testId={`target-list-item-${fixedItemIndex}`}
            className='w100pct'
            onKeyDown={onRenameKeydown}
            onChange={onRenameChange}
            onBlurCapture={clearRenameState}
            autoFocus
            placeholder={itemLabel}
            defaultValue={renameValue !== null ? renameValue : undefined}
          />
        ) : (
          <React.Fragment>
            <div data-testid={`target-list-item-${itemLabel}`} style={{ flexGrow: 1 }}>
              {itemLabel}
            </div>
            <div>{target.selectorLength === 0 ? null : target.selectorLength}</div>
          </React.Fragment>
        )}
      </UIRow>
    </ContextMenuWrapper>
  )
})

interface TargetListHeaderProps {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  setAddingIndex: React.Dispatch<React.SetStateAction<number | null>>
  selectedTargetPath: Array<string>
  isAdding: boolean
  targetIndex: number
}

const TargetListHeader = betterReactMemo('TargetListHeader', (props: TargetListHeaderProps) => {
  const { isOpen, setIsOpen, setAddingIndex, selectedTargetPath, isAdding, targetIndex } = props

  const startAdding = React.useCallback(() => {
    setIsOpen(true)
    setAddingIndex(targetIndex)
  }, [setIsOpen, setAddingIndex, targetIndex])

  const togglePathPanel = React.useCallback(() => setIsOpen((value) => !value), [setIsOpen])

  return (
    <FlexRow
      style={{
        paddingLeft: 8,
        paddingRight: 8,
        cursor: 'pointer',
        height: UtopiaTheme.layout.rowHeight.normal,
      }}
    >
      <SquareButton highlight onClick={Utils.NO_OP}>
        <ExpandableIndicator testId='style-tab-toggle' visible collapsed={false} selected={false} />
      </SquareButton>
      <H2
        data-testid={`target-selector-${selectedTargetPath[0]}`}
        style={{ flexGrow: 1, display: 'inline', overflow: 'hidden' }}
      >
        Styling
      </H2>
      <SectionActionSheet className='actionsheet'>
        {when(
          isOpen,
          <SquareButton highlight disabled={isAdding} onClick={startAdding}>
            <FunctionIcons.Add />
          </SquareButton>,
        )}
        <SquareButton highlight onClick={togglePathPanel}>
          <ExpandableIndicator
            testId='target-selector'
            visible
            collapsed={!isOpen}
            selected={false}
          />
        </SquareButton>
      </SectionActionSheet>
    </FlexRow>
  )
})

interface AddingRowProps {
  onInsert: (index: number, label: string) => void
  addingIndex: number
  addingIndentLevel: number | null
  finishAdding: () => void
}

const AddingRow = betterReactMemo('AddingRow', (props: AddingRowProps) => {
  const { addingIndex, finishAdding, addingIndentLevel, onInsert } = props
  const [value, setValue] = React.useState<string>('')

  const addItem = React.useCallback(() => {
    if (addingIndex != null) {
      onInsert(addingIndex, value)
    }
    finishAdding()
  }, [addingIndex, finishAdding, value, onInsert])

  const onAddKeydown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        addItem()
      } else if (e.key === 'Escape') {
        finishAdding()
      }
    },
    [addItem, finishAdding],
  )

  const onAddChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }, [])

  return (
    <UIRow
      rowHeight={'normal'}
      style={{
        minHeight: UtopiaTheme.layout.rowHeight.normal,
        marginRight: 8,
        marginBottom: 4,
        marginLeft: 8 + 10 * (addingIndentLevel ?? 0),
      }}
    >
      <OnClickOutsideHOC onClickOutside={finishAdding}>
        <StringInput
          testId='target-selector-adding-row'
          style={{ flexGrow: 1 }}
          autoFocus
          onKeyDown={onAddKeydown}
          onChange={onAddChange}
          value={value}
        />
      </OnClickOutsideHOC>
    </UIRow>
  )
})

function getCSSTargetLabel(target: CSSTarget): string {
  if (target.path.length > 0) {
    return target.path[target.path.length - 1]
  }
  // TODO Parsing safety: If a user messes up the CSSTarget metadata, they
  // are going to crash the app, which is definitely not a good experience
  throw new Error('CSSTarget can not be empty')
}

export function getCSSTargetIndex(targetPath: Array<string>, allTargets: Array<CSSTarget>) {
  return allTargets.findIndex((t) => Utils.shallowEqual(t.path, targetPath))
}

interface MiniTargetSelectorProps {
  targets: CSSTarget[]
  selectedTargetPath: string[]
  onSelect: (targetPath: Array<string>) => void
}

const MiniTargetSelector = betterReactMemo(
  'MiniTargetSelector',
  (props: MiniTargetSelectorProps) => {
    const colorTheme = useColorTheme()
    const { targets, selectedTargetPath } = props
    const targetIndex = getCSSTargetIndex(selectedTargetPath, targets)

    const [displayedTargetPath, setDisplayedTargetPath] = React.useState(
      selectedTargetPath.join(' '),
    )

    const onItemMouseEnter = React.useCallback(
      (targetPath: string) => {
        setDisplayedTargetPath(targetPath)
      },
      [setDisplayedTargetPath],
    )
    const onItemMouseLeave = React.useCallback(() => {
      setDisplayedTargetPath(selectedTargetPath.join(' '))
    }, [setDisplayedTargetPath, selectedTargetPath])

    return (
      <React.Fragment>
        <FlexRow
          style={{
            paddingLeft: 8,
            flexWrap: 'wrap',
          }}
        >
          {targets.map((target) => {
            return (
              <MiniTargetItem
                onMouseEnter={onItemMouseEnter}
                onMouseLeave={onItemMouseLeave}
                key={target.path.join()}
                target={target}
                selectedTargetPath={selectedTargetPath}
                onSelect={props.onSelect}
              />
            )
          })}
        </FlexRow>
        <SelectionLineWithArrow targetIndex={targetIndex} />
        <FlexRow style={{ justifyContent: 'center', padding: 4, paddingTop: 0 }}>
          <SelectedTargetLabel
            style={
              {
                // backgroundColor: colorTheme.fg8.value,
              }
            }
          >
            {displayedTargetPath}
          </SelectedTargetLabel>
        </FlexRow>
      </React.Fragment>
    )
  },
)

interface MiniTargetItemProps {
  target: CSSTarget
  selectedTargetPath: string[]
  onSelect: (targetPath: Array<string>) => void
  onMouseEnter: (targetPath: string) => void
  onMouseLeave: () => void
}
const MiniTargetItem = betterReactMemo('MiniTargetItem', (props: MiniTargetItemProps) => {
  const { target, selectedTargetPath } = props
  const isSelected = arrayEquals(target.path, selectedTargetPath)
  const colorTheme = useColorTheme()
  const mediaQuery = target.path.find((pathElement) => pathElement.includes('media'))
  const mediaQueryMatch = mediaQuery?.match(/@media \(min-width: (.*?)\)/)
  const mediaQuerySize = mediaQueryMatch != null ? mediaQueryMatch[1] : null

  const hasHover = target.path.includes('&:hover') || target.path.includes(':hover')

  const filteredPath = target.path.filter((path) => !path.includes(':hover'))
  let textToDisplay = filteredPath.join(' ')
  if (filteredPath.length === 1) {
    textToDisplay = filteredPath[0]
  } else {
    if (mediaQuery != null && mediaQuerySize != null) {
      textToDisplay = mediaQuerySize
    } else {
      textToDisplay = filteredPath.slice(1).join(' ')
    }
  }
  if (target.path.length === 1) {
    if (target.path[0] === 'css') {
      textToDisplay = '💅'
    } else if (target.path[0] === 'style') {
      textToDisplay = '🏠'
    }
  }
  const [isOver, setIsOver] = React.useState(false)
  const isStyle = target.path.includes('style')
  return (
    <Tooltip title={`${target.path.join(' ')}`}>
      <div
        onMouseEnter={() => {
          props.onMouseEnter(target.path.join(' '))
          setIsOver(true)
        }}
        onMouseLeave={() => {
          props.onMouseLeave()
          setIsOver(false)
        }}
        style={{
          backgroundColor: isSelected
            ? colorTheme.primary.value
            : isOver
            ? '#89c2ff'
            : 'transparent',
          height: 24,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 2,
        }}
      >
        <div
          onClick={() => props.onSelect(target.path)}
          style={{
            backgroundColor: isStyle ? colorTheme.primary.value : '#60d2d6',
            fontStyle: target.selectorLength === 0 ? 'italic' : undefined,
            height: 20,
            border: `1px solid ${isStyle ? '#89c2ff ' : '#9ee4e6'}`,
            color: colorTheme.white.value,
            textAlign: 'center',
            fontSize: 12,
            lineHeight: '18px',
            cursor: 'pointer',
            padding: '0px 2px',
            display: 'flex',
            alignItems: 'center',
            columnGap: 8,
          }}
        >
          {hasHover && (
            <div
              style={{
                backgroundColor: 'transparent',
                backgroundSize: 18,
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                outline: 'none',
                border: 'none',
                width: 18,
                height: 18,
                backgroundImage: `url(${UNSAFE_getIconURL(
                  'bracketed-pointer',
                  'white',
                  'semantic',
                  18,
                  18,
                )})`,
              }}
            ></div>
          )}
          <div
            style={{
              maxWidth: 70,
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {textToDisplay}
          </div>
          {target.selectorLength > 0 && (
            <div
              style={{ paddingLeft: 2, borderLeft: `1px solid ${isStyle ? '#89c2ff' : '#9ee4e6'}` }}
            >
              {target.selectorLength}
            </div>
          )}
        </div>
      </div>
    </Tooltip>
  )
})

const SelectionLineWithArrow = betterReactMemo(
  'SelectionLineWithArrow',
  (props: { targetIndex: number }) => {
    const colorTheme = useColorTheme()
    return (
      <div style={{ paddingTop: 2 }}>
        <div style={{ borderBottom: '1px solid hsl(0,0%,90%)', width: '100%' }} />
        <div
          style={{
            borderTop: '1px solid hsl(0,0%,90%)',
            borderLeft: '1px solid hsl(0,0%,90%)',
            transform: 'rotate(45deg)',
            width: 5,
            height: 5,
            position: 'relative',
            top: -4,
            background: colorTheme.inspectorBackground.value,
            left: 15 + 28 * props.targetIndex,
          }}
        />
      </div>
    )
  },
)

const SelectedTargetLabel = styled.div({
  color: '#6b6b6b',
  padding: '2px 8px',
  width: UtopiaTheme.layout.inspectorSmallWidth - 20,
  borderRadius: 4,
  fontWeight: 500,
  textAlign: 'center',
})
