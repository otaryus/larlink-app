import { ApiProfileRepository } from '../modules/profile/adapters/ApiProfileRepository'
import { makeLoadProfile, makeSaveProfile } from '../modules/profile/application/profile'
import { ApiWorkspaceClient } from '../modules/workspace/adapters/ApiWorkspaceClient'
import {
  makeLoadContractTimeline,
  makeLoadOperations,
  makeLoadRoleHome,
  makeWorkspaceActions,
  makeSaveClientProfile,
  makeSaveWorkerPhoto,
  makeSaveWorkerProfile,
  makeSearchMatching,
} from '../modules/workspace/application/workspace'

const profiles = new ApiProfileRepository()
const workspace = new ApiWorkspaceClient()

export const profileUseCases = {
  loadProfile: makeLoadProfile(profiles),
  saveProfile: makeSaveProfile(profiles),
}

export const workspaceUseCases = {
  loadRoleHome: makeLoadRoleHome(workspace),
  loadContractTimeline: makeLoadContractTimeline(workspace),
  loadOperations: makeLoadOperations(workspace),
  searchMatching: makeSearchMatching(workspace),
  saveClientProfile: makeSaveClientProfile(workspace),
  saveWorkerProfile: makeSaveWorkerProfile(workspace),
  saveWorkerPhoto: makeSaveWorkerPhoto(workspace),
  actions: makeWorkspaceActions(workspace),
}
