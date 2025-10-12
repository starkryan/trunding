import axios, { AxiosError } from 'axios'

export interface CreateOrderRequest {
  customer_mobile: string
  customer_name: string
  user_token: string
  amount: string
  order_id: string
  redirect_url: string
  remark1: string
  remark2: string
}

export interface CreateOrderResponse {
  status: boolean
  message: string
  result?: {
    orderId: string
    payment_url: string
  }
}

export default class CreateOrderSDK {
  private readonly baseUrl: string

  constructor(baseUrl: string = 'https://pay0.shop/api') {
    this.baseUrl = baseUrl
  }

  async createOrder(payload: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const response = await axios.post<CreateOrderResponse>(
        `${this.baseUrl}/api/create-order`,
        payload,
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