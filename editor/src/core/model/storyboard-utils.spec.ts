import { addFileToProjectContents, getContentsTreeFileFromString } from '../../components/assets'
import { createTestProjectWithCode } from '../../components/canvas/canvas-utils'
import {
  editorModelFromPersistentModel,
  EditorState,
} from '../../components/editor/store/editor-state'
import { foldEither } from '../shared/either'
import { clearTopLevelElementUniqueIDs } from '../shared/element-template'
import { isUIJSFile } from '../shared/project-file-types'
import { NO_OP } from '../shared/utils'
import { codeFile } from './project-file-utils'
import { addStoryboardFileToProject, StoryboardFilePath } from './storyboard-utils'

function createTestProjectLackingStoryboardFile(): EditorState {
  const appFile = `/** @jsx jsx */
import * as React from 'react'
import { jsx } from 'utopia-api'
export var App = (props) => {
  return <div style={{ ...props.style}} data-uid={'aaa'} data-label={'Hat'} />
}`
  const persistentModel = createTestProjectWithCode(appFile)
  return editorModelFromPersistentModel(persistentModel, NO_OP)
}

describe('addStoryboardFileToProject', () => {
  it('adds storyboard file to project that does not have one', () => {
    const actualResult = addStoryboardFileToProject(createTestProjectLackingStoryboardFile())
    if (actualResult == null) {
      fail('Editor state was not updated.')
    } else {
      const storyboardFile = getContentsTreeFileFromString(
        actualResult.projectContents,
        StoryboardFilePath,
      )
      if (storyboardFile == null) {
        fail('No storyboard file was created.')
      } else {
        if (isUIJSFile(storyboardFile)) {
          const topLevelElements = foldEither(
            (_) => [],
            (success) => {
              return success.topLevelElements.map(clearTopLevelElementUniqueIDs)
            },
            storyboardFile.fileContents,
          )
          expect(topLevelElements).toMatchSnapshot()
        } else {
          fail('Storyboard file is not a UI JS file.')
        }
      }
    }
  })
  it('does not add a storyboard file to a project that already has one', () => {
    const expectedFile = codeFile('oh no, this is not a real storyboard file', null)
    let editorModel = createTestProjectLackingStoryboardFile()
    editorModel = {
      ...editorModel,
      projectContents: addFileToProjectContents(
        editorModel.projectContents,
        StoryboardFilePath,
        expectedFile,
      ),
    }
    const actualResult = addStoryboardFileToProject(editorModel)
    expect(actualResult).toBeNull()
  })
})