import { NextRequest, NextResponse } from "next/server"
import { getServerSession, auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

// Kukupay API configuration
const KUKUPAY_API_URL = "https://kukupay.pro/pay/create"
const KUKUPAY_API_KEY = process.env.KUKUPAY_API_KEY || "1tqgOifuydEFIc5Ss8JzWuLfawB227om" // Default to provided key for demo

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession()
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Get user details from the session directly
    // Since we have the userId from session, we can use it directly
    const userId = session.userId

    // Parse request body
    const body = await request.json()
    const { serviceId, amount, serviceName } = body

    if (!serviceId || !amount || !serviceName) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Generate collision-resistant genuine and professional order ID
    const generateOrderId = () => {
      // Format: TXN + timestamp (milliseconds) + random characters
      // This makes collisions virtually impossible even with concurrent payments
      const timestamp = Date.now().toString() // Full timestamp in milliseconds
      const randomPart1 = Math.random().toString(36).substr(2, 6).toUpperCase()
      const randomPart2 = Math.random().toString(36).substr(2, 6).toUpperCase()
      return `TXN${timestamp}${randomPart1}${randomPart2}`
    }

    // Function to ensure unique order ID with retry logic
    const ensureUniqueOrderId = async (maxRetries = 3) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const orderId = generateOrderId()
        
        // Check if order ID already exists in database
        const existingPayment = await prisma.payment.findFirst({
          where: {
            providerOrderId: orderId
          }
        })
        
        if (!existingPayment) {
          return orderId // Order ID is unique
        }
        
        // If order ID exists, wait a bit and retry (for concurrent scenarios)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100 * attempt)) // Exponential backoff
        }
      }
      
      // If we get here, all retries failed - use timestamp with extra randomness
      const timestamp = Date.now().toString()
      const extraRandom = Math.random().toString(36).substr(2, 8).toUpperCase()
      return `TXN${timestamp}${extraRandom}${Date.now().toString(36)}`
    }
    
    const orderId = await ensureUniqueOrderId()

    // Get user phone number - use the exact format from the example
    // In a real implementation, you might want to add a phone field to the User model
    const userPhone = "USER_PHONE" // Using the exact placeholder from the example

    // Prepare webhook and return URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || "http://localhost:3000"
    const webhookUrl = `${baseUrl}/api/payment/webhook`
    const returnUrl = `${baseUrl}/wallet?payment_success=true&order_id=${orderId}`

    // Prepare Kukupay API request - use exact format from example
    const kukupayData = {
      api_key: KUKUPAY_API_KEY,
      amount: amount,
      phone: userPhone,
      webhook_url: webhookUrl,
      return_url: returnUrl,
      order_id: orderId,
    }

    // Also try the exact return URL format from the example
    const exampleReturnUrl = `https://t.me/kukupaybot?start=${orderId}`

    console.log("Initiating payment with Kukupay:", {
      orderId,
      amount,
      serviceId,
      webhookUrl,
      returnUrl,
      exampleReturnUrl,
      userPhone,
      kukupayData,
    })

    // Try with the example return URL first
    const kukupayDataWithExampleReturn = {
      ...kukupayData,
      return_url: exampleReturnUrl,
    }

    console.log("Trying with example return URL:", kukupayDataWithExampleReturn)

    // Make request to Kukupay API
    const response = await fetch(KUKUPAY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(kukupayDataWithExampleReturn),
    })

    const kukupayResponse = await response.json()

    console.log("Kukupay API response:", kukupayResponse)
    console.log("Kukupay API response status:", response.status)
    console.log("Kukupay API response headers:", Object.fromEntries(response.headers))

    if (kukupayResponse.status === 200 && kukupayResponse.data && kukupayResponse.data.payment_url) {
      // Use database transaction to ensure atomic operation
      const result = await prisma.$transaction(async (tx) => {
        // Double-check that order ID is still unique (race condition protection)
        const existingPayment = await tx.payment.findFirst({
          where: {
            providerOrderId: orderId
          }
        })
        
        if (existingPayment) {
          throw new Error("Order ID collision detected - please try again")
        }
        
        // Ensure wallet exists for the user using upsert operation
        const wallet = await tx.wallet.upsert({
          where: { userId: userId },
          update: {}, // No update needed if wallet exists
          create: {
            userId: userId,
            balance: 0,
            currency: "INR",
          },
        })
        
        // Store payment details in database
        const payment = await tx.payment.create({
          data: {
            userId: userId,
            amount: amount,
            currency: "INR",
            status: "PENDING",
            provider: "KUKUPAY",
            providerOrderId: orderId,
            paymentUrl: kukupayResponse.data.payment_url,
            phone: userPhone,
            metadata: {
              serviceId: serviceId,
              serviceName: serviceName,
              kukupayResponse: kukupayResponse,
            },
          },
        })
        
        return payment
      })

      console.log(`Payment record created: ${result.id}`)
      
      // Generate custom payment URL that hides the Kukupay URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || "http://localhost:3000"
      const customPaymentUrl = `${baseUrl}/payment/${orderId}`
      
      return NextResponse.json({
        success: true,
        paymentUrl: customPaymentUrl,
        orderId: orderId,
        paymentId: result.id,
        transactionId: kukupayResponse.data.transaction_id,
      })
    } else {
      console.error("Kukupay API error:", kukupayResponse)
      return NextResponse.json(
        { 
          success: false, 
          error: kukupayResponse.message || "Failed to create payment with Kukupay",
          details: kukupayResponse.gateway_response || kukupayResponse.error || "No additional details available"
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Payment creation error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
