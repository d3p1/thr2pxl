/**
 * @description Debug manager
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @note        The idea behind this class is to encapsulate and wrap the
 *              debug management logic
 */
import {Pane} from 'tweakpane'
import type {BindingParams, FolderParams, FolderApi} from 'tweakpane'
import {BindingApi} from '@tweakpane/core'
import {getSettings} from './debug-manager/copy/settings.js'

export default class DebugManager {
  /**
   * @type {Pane}
   */
  debugger: Pane

  /**
   * Constructor
   */
  constructor() {
    this.debugger = new Pane()
    this.#addCopyButton()
  }

  /**
   * Enable. Show debugger
   *
   * @returns {void}
   */
  enable(): void {
    this.debugger.element.style.display = 'block'
  }

  /**
   * Disable. Hide debugger
   *
   * @returns {void}
   */
  disable(): void {
    this.debugger.element.style.display = 'none'
  }

  /**
   * Dispose
   *
   * @returns {void}
   */
  dispose(): void {
    this.debugger.dispose()
    this.debugger.element.remove()
  }

  /**
   * Add folder
   *
   * @param   {{title: string; expanded?: boolean;}} config
   * @returns {object}
   */
  addFolder(config: FolderParams): FolderApi {
    config = {expanded: false, ...config}
    return this.debugger.addFolder(config)
  }

  /**
   * Add binding with on change handler
   *
   * @param   {object}             object
   * @param   {string}             property
   * @param   {string}             label
   * @param   {object | undefined} config
   * @param   {object | undefined} folder
   * @returns {object}
   */
  addBindingWithOnChange<K extends string, V>(
    object: {[key in K]: V},
    property: K,
    label: string,
    config: BindingParams | undefined,
    folder: FolderApi | undefined = undefined,
  ): BindingApi<unknown, V> {
    return this.addBinding(label, object[property], config, folder).on(
      'change',
      (e) => {
        object[property] = e.value
      },
    )
  }

  /**
   * Add binding
   *
   * @param   {string}             label
   * @param   {string | number}    value
   * @param   {object | undefined} config
   * @param   {object | undefined} folder
   * @returns {object}
   */
  addBinding<V>(
    label: string,
    value: V,
    config: BindingParams | undefined,
    folder: FolderApi | undefined = undefined,
  ): BindingApi<unknown, V> {
    let debuggerObj: Pane | FolderApi = this.debugger
    if (folder) {
      debuggerObj = folder
    }

    return debuggerObj.addBinding(
      {
        [label]: value,
      },
      label,
      config,
    )
  }

  /**
   * Add copy button
   *
   * @returns {void}
   */
  #addCopyButton(): void {
    const btn = this.debugger.addButton({
      title: 'Copy',
    })
    btn.on('click', () => {
      const state = this.debugger.exportState()

      if (state.children && state.children instanceof Array) {
        const pointer = state.children[1]
        const pointerStrength = pointer.children[0]['binding']['value']
        const pointerMinRad = pointer.children[1]['binding']['value']
        const pointerMaxRad = pointer.children[2]['binding']['value']
        const pointerPulseStrength = pointer.children[3]['binding']['value']
        const pointerPulseFrequency = pointer.children[4]['binding']['value']

        const modelPoint = state.children[2]
        const modelPointSize = modelPoint.children[0]['binding']['value']

        const modelPointMotion = state.children[3]
        const modelPointMotionFrequency =
          modelPointMotion.children[0]['binding']['value']
        const modelPointMotionStrength =
          modelPointMotion.children[1]['binding']['value']
        const modelPointMotionRatio =
          modelPointMotion.children[2]['binding']['value']
        const modelPointMotionPointLifeDecay =
          modelPointMotion.children[3]['binding']['value']

        const settings = getSettings(
          modelPointSize,
          modelPointMotionFrequency,
          modelPointMotionStrength,
          modelPointMotionRatio,
          modelPointMotionPointLifeDecay,
          pointerStrength,
          pointerMinRad,
          pointerMaxRad,
          pointerPulseStrength,
          pointerPulseFrequency,
        )

        navigator.clipboard.writeText(settings).then(() => {
          btn.title = 'Copied!'
          setTimeout(() => {
            btn.title = 'Copy'
          }, 1000)
        })
      }
    })
  }
}
