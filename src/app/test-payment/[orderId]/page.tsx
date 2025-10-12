"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function TestPaymentPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return

    const fetchPaymentDetails = async () => {
      try {
        const response = await fetch(`/api/payment/details/${orderId}`)
        const data = await response.json()
        setPaymentDetails(data)
      } catch (error) {
        console.error("Error fetching payment details:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentDetails()
  }, [orderId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Payment Details...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!paymentDetails?.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Payment Not Found</h2>
          <p className="text-gray-600">Order ID: {orderId}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Test Payment Details</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Payment Information</h2>

        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="font-medium">Order ID:</span>
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {paymentDetails.payment.orderId}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">Amount:</span>
            <span>₹{paymentDetails.payment.amount}</span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">Status:</span>
            <span className={`px-2 py-1 rounded text-sm ${
              paymentDetails.payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
              paymentDetails.payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {paymentDetails.payment.status}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">Provider:</span>
            <span>{paymentDetails.payment.provider}</span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">Payment URL:</span>
            <a
              href={paymentDetails.payment.paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm truncate max-w-xs"
            >
              {paymentDetails.payment.paymentUrl}
            </a>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">Created:</span>
            <span>{new Date(paymentDetails.payment.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Test Navigation</h2>
        <div className="space-y-4">
          <a
            href={`/payment/${orderId}`}
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Payment Page
          </a>

          <a
            href="/"
            className="inline-block bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 ml-4"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}