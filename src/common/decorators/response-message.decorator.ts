import { SetMetadata } from "@nestjs/common"

export const RESPONSE_MSG_KEY = 'rps_msg'
export const ResponseMessage = (msg: string) => SetMetadata(RESPONSE_MSG_KEY, msg)