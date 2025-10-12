import axios, { AxiosResponse, AxiosError } from 'axios'

export interface CheckOrderStatusRequest {
  user_token: string
  order_id: string
}

export interface CheckOrderStatusResponse {
  status: boolean
  message: string
  result?: {
    txnStatus: 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED'
    orderId: string
    amount: string
    date: string
    utr?: string
  }
}

export default class CheckOrderStatusSDK {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async checkOrderStatus(request: CheckOrderStatusRequest): Promise<CheckOrderStatusResponse> {
    try {
      const response: AxiosResponse<CheckOrderStatusResponse> = await axios.post(
        `${this.baseUrl}/api/check-order-status`,
        request,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return error.response?.data || {
          status: false,
          message: 'Network error occurred',
        }
      }

      return {
        status: false,
        message: 'Unexpected error occurred',
      }
    }
  }
}