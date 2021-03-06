import { EventEmitter } from 'events'
import { ReadStream } from 'fs'
import $ from 'cafy'
import axios, { AxiosInstance } from 'axios'
import crypto from 'crypto'
import FormData from 'form-data'
import WebSocket from 'ws'

/**
 * Validator for Hydrobond
 */
class Validator {
  /**
   * Validate date string
   */
  public static isValidDate = $.str.pipe(
    (str: string): boolean => !isNaN(new Date(str).getTime())
  )

  /**
   * Validate url string
   */
  public static isValidUrl = $.str.pipe((str: string): boolean => {
    try {
      new URL(str)
      return true
    } catch (error) {
      return false
    }
  })
}

/**
 * Application
 */
export class Application {
  public id: number
  public name: string

  /**
   * Validate
   *
   * @param {Partial<Application>} application object
   */
  private validate(
    application: Partial<Application>
  ): { id: number; name: string } {
    return $.obj({
      id: $.num,
      name: $.str
    }).throw(application)
  }

  /**
   * Constructor
   *
   * @param {Partial<Application>} a object
   */
  public constructor(a: Partial<Application>) {
    const application = this.validate(a)

    this.id = application.id
    this.name = application.name
  }
}

/**
 * Authorization
 */
export class Authorization {
  public accessToken: string
  public clientId: string
  public clientSecret: string
  public stateText: string
  public tokenType: string = 'Bearer'

  /**
   * Validate
   *
   * @param {Partial<Authorization>} authorization object
   */
  private validate(
    authorization: Partial<Authorization>
  ): {
    accessToken: string | undefined
    clientId: string | undefined
    clientSecret: string | undefined
    stateText: string | undefined
  } {
    return $.obj({
      accessToken: $.optional.str,
      clientId: $.optional.str,
      clientSecret: $.optional.str,
      stateText: $.optional.str
    }).throw(authorization)
  }

  /**
   * Make state parameter for authorize
   * https://tools.ietf.org/html/draft-ietf-oauth-v2-31#section-10.12
   *
   * @returns {string}
   */
  private getStateText(): string {
    return crypto.randomBytes(8).toString('hex')
  }

  /**
   * Constructor
   *
   * @param {Partial<Authorization>} a object
   */
  public constructor(a: Partial<Authorization>) {
    const authorization = this.validate(a)

    this.accessToken = authorization.accessToken || ''
    this.clientId = authorization.clientId || ''
    this.clientSecret = authorization.clientSecret || ''
    this.stateText = authorization.stateText || this.getStateText()
  }
}

/**
 * File
 */
export class File {
  public id: number
  public name: string
  public variants: {
    id: number
    score: number
    extension: string
    type: string
    size: number
    url: URL
    mime: string
  }[]

  /**
   * Validate
   *
   * @param {Partial<File>} file object
   */
  private validate(
    file: Partial<File>
  ): {
    id: number
    name: string
    variants: {
      id: number
      score: number
      extension: string
      type: string
      size: number
      url: string
      mime: string
    }[]
  } {
    return $.obj({
      id: $.num,
      name: $.str,
      variants: $.array(
        $.obj({
          id: $.num,
          score: $.num,
          extension: $.str,
          type: $.str,
          size: $.num,
          url: Validator.isValidUrl,
          mime: $.str
        })
      )
    }).throw(file)
  }

  /**
   * Constructor
   *
   * @param {Partial<File>} f object
   */
  public constructor(f: Partial<File>) {
    const file = this.validate(f)

    this.id = file.id
    this.name = file.name
    this.variants = file.variants.map((variant): {
      id: number
      score: number
      extension: string
      type: string
      size: number
      url: URL
      mime: string
    } => {
      return {
        id: variant.id,
        score: variant.score,
        extension: variant.extension,
        type: variant.type,
        size: variant.size,
        url: new URL(variant.url),
        mime: variant.mime
      }
    })
  }
}

/**
 * Post body
 */
export class PostBody {
  public text: string
  public fileIds?: number[]

  /**
   * Validate
   *
   * @param {Partial<PostBody>} postBody object
   */
  private validate(
    postBody: Partial<PostBody>
  ): { text: string; fileIds: number[] | undefined } {
    return $.obj({
      text: $.str.max(512),
      fileIds: $.optional.array($.num)
    }).throw(postBody)
  }

  /**
   * Constructor
   *
   * @param {Partial<PostBody>} p object
   */
  public constructor(p: Partial<PostBody>) {
    const postBody = this.validate(p)

    this.text = postBody.text
    this.fileIds = postBody.fileIds
  }
}

/**
 * Token class
 */
export class Token {
  public accessToken: string
  public tokenType: string

  /**
   * Validate
   *
   * @param {Partial<Token>} token object
   */
  private validate(
    token: Partial<Token>
  ): { access_token: string; token_type: string } {
    return $.obj({
      /* eslint-disable @typescript-eslint/camelcase */
      access_token: $.str,
      token_type: $.str
      /* eslint-enable @typescript-eslint/camelcase */
    }).throw(token)
  }

  /**
   * Constructor
   *
   * @param {Partial<Token>} t object
   */
  public constructor(t: Partial<Token>) {
    const token = this.validate(t)

    this.accessToken = token.access_token
    this.tokenType = token.token_type
  }
}

/**
 * User class
 */
export class User {
  public avatarFile: File | null
  public createdAt: Date
  public id: number
  public name: string
  public postsCount: number
  public screenName: string
  public updatedAt: Date

  /**
   * Validate
   *
   * @param {Partial<User>} account object
   */
  private validate(
    account: Partial<User>
  ): {
    avatarFile: Partial<File>
    createdAt: string
    id: number
    name: string
    postsCount: number
    screenName: string
    updatedAt: string
  } {
    return $.obj({
      avatarFile: $.nullable.any,
      createdAt: Validator.isValidDate,
      id: $.num,
      name: $.str.range(1, 20),
      postsCount: $.num,
      screenName: $.str.match(/^[0-9a-zA-Z_]{1,20}$/),
      updatedAt: Validator.isValidDate
    }).throw(account)
  }

  /**
   * Constructor
   *
   * @param {Partial<User>} a object
   */
  public constructor(a: Partial<User>) {
    const account = this.validate(a)

    this.avatarFile = account.avatarFile ? new File(account.avatarFile) : null
    this.createdAt = new Date(account.createdAt)
    this.id = account.id
    this.name = account.name
    this.postsCount = account.postsCount
    this.screenName = account.screenName
    this.updatedAt = new Date(account.updatedAt)
  }
}

/**
 * Post
 */
export class Post {
  public application: Application
  public createdAt: Date
  public id: number
  public text: string
  public updatedAt: Date
  public user: User
  public files: File[]

  /**
   * Validate
   *
   * @param {Partial<Post>} post object
   */
  private validate(
    post: Partial<Post>
  ): {
    application: Partial<Application>
    createdAt: string
    id: number
    text: string
    updatedAt: string
    user: Partial<User>
    files: Partial<File>[]
  } {
    return $.obj({
      application: $.any,
      createdAt: Validator.isValidDate,
      id: $.num,
      text: $.str.max(512),
      updatedAt: Validator.isValidDate,
      user: $.any,
      files: $.arr($.any)
    }).throw(post)
  }

  /**
   * Constructor
   *
   * @param {Partial<Post>} p object
   */
  public constructor(p: Partial<Post>) {
    const post = this.validate(p)

    this.application = new Application(post.application)
    this.createdAt = new Date(post.createdAt)
    this.id = post.id
    this.text = post.text
    this.updatedAt = new Date(post.updatedAt)
    this.user = new User(post.user)
    this.files = []

    this.files = post.files.map((file): File => new File(file))
  }
}

/**
 * User settings
 */
export class UserSettings {
  public avatarFileId?: number
  public name?: string

  /**
   * Validate
   *
   * @param {Partial<UserSettings>} userSettings object
   */
  private validate(
    userSettings: Partial<UserSettings>
  ): { avatarFileId: number | undefined; name: string | undefined } {
    return $.obj({
      avatarFileId: $.optional.num,
      name: $.optional.str.range(1, 20)
    }).throw(userSettings)
  }

  /**
   * Constructor
   *
   * @param {Partial<UserSettings>} p object
   */
  public constructor(u: Partial<UserSettings>) {
    const userSettings = this.validate(u)

    this.avatarFileId = userSettings.avatarFileId
    this.name = userSettings.name
  }
}

/**
 * Hydrobond main class
 */
export default class Hydrobond {
  private apiEndpoint: URL
  private auth: Authorization
  private axios: AxiosInstance
  private oauthEndpoint: URL

  /**
   * Constructor
   *
   * @param {URL} apiEndpoint API endpoint
   * @param {URL} oauthEndpoint API endpoint
   * @param {Authorization} auth Params
   */
  public constructor(
    apiEndpoint: URL,
    oauthEndpoint: URL,
    auth: Partial<Authorization>
  ) {
    this.apiEndpoint = apiEndpoint
    this.oauthEndpoint = oauthEndpoint

    this.auth = new Authorization(auth)

    this.axios = axios.create({
      baseURL: this.apiEndpoint.href
    })

    if (this.auth.accessToken !== '') {
      this.axios.defaults.headers.common[
        'Authorization'
      ] = `${this.auth.tokenType} ${this.auth.accessToken}`
    }
  }

  /**
   * Make authorize url
   *
   * @returns {URL}
   */
  public getAuthorizeUrl(): URL {
    if (this.auth.clientId === '') throw Error('clientId is empty')

    return new URL(
      `${this.oauthEndpoint.href}/authorize?client_id=${this.auth.clientId}&response_type=code&state=${this.auth.stateText}`
    )
  }

  /**
   * Authorize with authorization code
   *
   * @param {string} authCode authorization_code
   *
   * @returns {Promise<string>} access_token
   */
  public async authorize(authCode: string): Promise<string> {
    if (this.auth.clientId === '') throw Error('clientId is empty')
    if (this.auth.clientSecret === '') throw Error('clientSecret is empty')

    const res = await this.axios({
      method: 'post',
      url: `/token?client_id=${this.auth.clientId}&response_type=code&state=${this.auth.stateText}`,
      baseURL: this.oauthEndpoint.href,
      data: {
        /* eslint-disable @typescript-eslint/camelcase */
        client_id: this.auth.clientId,
        client_secret: this.auth.clientSecret,
        code: authCode,
        grant_type: 'authorization_code',
        state: this.auth.stateText
        /* eslint-enable @typescript-eslint/camelcase */
      }
    })

    const token = new Token(res.data)

    this.auth.accessToken = token.accessToken
    this.axios.defaults.headers.common[
      'Authorization'
    ] = `${this.auth.tokenType} ${this.auth.accessToken}`

    return this.auth.accessToken
  }

  /**
   * Post
   *
   * @param {PostBody} post post body
   *
   * @returns {Promise<Post>}
   */
  public async post(post: PostBody): Promise<Post> {
    const res = await this.axios.post<Post>('/v1/posts', post)

    return new Post(res.data)
  }

  /**
   * Get timeline
   *
   * @param {number|undefined} count count
   * @param {number|undefined} sinceId since
   * @param {number|undefined} maxId max
   *
   * @returns {Promise<Post[]>}
   */
  public async getTimeline(
    count?: number,
    sinceId?: number,
    maxId?: number
  ): Promise<Post[]> {
    if (count !== undefined && count > 100)
      throw new Error('count must be less than or equal to 100')
    if (count !== undefined && count < 1)
      throw new Error('count must be greater than or equal to 1')

    const res = await this.axios.get(`/v1/timelines/public`, {
      params: {
        count,
        sinceId,
        maxId
      }
    })

    return res.data.map((post: Partial<Post>): Post => new Post(post))
  }

  /**
   * Change user settings
   *
   * @param {UserSettings} setting user settings
   *
   * @returns {Promise<User>}
   */
  public async updateAccount(setting: UserSettings): Promise<User> {
    const res = await this.axios.patch<User>(`/v1/account`, setting)

    return new User(res.data)
  }

  /**
   * Post file
   *
   * @param {string} name File name
   * @param {ReadStream} file File stream
   * @param {boolean} addDate Add date string when name conflict
   * @param {number} folderId Folder Id
   *
   * @returns {Promise<File>}
   */
  public async postFile(
    name: string,
    file: ReadStream,
    addDate: boolean,
    folderId?: number
  ): Promise<File> {
    const form = new FormData()

    form.append('name', name)
    form.append('file', file)

    if (folderId !== undefined) form.append('folderId', folderId)
    if (addDate === true) form.append('ifNameConflicted', 'add-date-string')
    else form.append('ifNameConflicted', 'error')

    const res = await this.axios.post<File>(`/v1/album/files`, form, {
      headers: form.getHeaders()
    })

    return new File(res.data)
  }

  /**
   * Connect to Stream with WebSocket
   *
   * @param {string} stream Stream name
   *
   * @returns {EventEmitter}
   */
  public stream(stream: string): EventEmitter {
    const eventEmitter = new EventEmitter()

    const ws = new WebSocket(this.apiEndpoint.href)

    /**
     * Close
     *
     * @param {number} code close code
     * @param {string} reason reason
     */
    const close = (code: number, reason: string): void => {
      eventEmitter.emit('close', { code, reason })
    }

    /**
     * Error
     *
     * @param {Error} error error
     */
    const error = (error: Error): void => {
      throw error
    }

    /**
     * Receive message
     *
     * @param {string} data messsage
     */
    const message = (data: string): void => {
      try {
        const message = JSON.parse(data)

        switch (message.type) {
          case 'message':
            eventEmitter.emit('message', new Post(message.content as Post))
            break
          case 'ping':
            ws.send(
              JSON.stringify({
                type: 'ping'
              })
            )
            break
          case 'success':
            eventEmitter.emit('connect')
            break
          case 'error':
          default:
            throw new Error(data)
        }
      } catch (e) {
        throw new Error(JSON.stringify(e))
      }
    }

    /**
     * Open
     */
    const open = (): void => {
      ws.send(
        JSON.stringify({
          type: 'connect',
          stream: stream,
          token: this.auth.accessToken
        })
      )
    }

    ws.on('close', close)
    ws.on('error', error)
    ws.on('message', message)
    ws.on('open', open)

    /**
     * Disconnect
     *
     * @param {number} code close code
     * @param {string} reason reason
     */
    eventEmitter.addListener(
      'disconnect',
      (code?: number, reason?: string): void => {
        ws.close(code, reason)
      }
    )

    return eventEmitter
  }
}
