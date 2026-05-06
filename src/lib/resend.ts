import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export async function sendEmail(options: EmailOptions) {
  try {
    const { from = process.env.RESEND_FROM_EMAIL || 'noreply@anantarafashion.com', ...emailOptions } = options
    
    const { data, error } = await resend.emails.send({
      from,
      ...emailOptions,
    })

    if (error) {
      console.error('Error sending email via Resend:', error)
      return { success: false, error: error.message }
    }

    console.log('Email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error sending email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Template functions for common email types
export const emailTemplates = {
  // Welcome email
  welcome: (name: string) => ({
    subject: 'Welcome to Anantra Fashion!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #5F613A; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Anantra Fashion</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333;">Welcome, ${name}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for joining Anantra Fashion. We're excited to have you as part of our community!
          </p>
          <p style="color: #666; line-height: 1.6;">
            Start exploring our latest collection and enjoy exclusive benefits.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://anantra.com'}" 
               style="background-color: #5F613A; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Shop Now
            </a>
          </div>
        </div>
        <div style="background-color: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>&copy; 2024 Anantra Fashion. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  // Order confirmation
  orderConfirmation: (name: string, orderId: string, orderDetails: any) => ({
    subject: `Order Confirmation - ${orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #5F613A; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Anantra Fashion</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333;">Order Confirmed!</h2>
          <p style="color: #666; line-height: 1.6;">
            Hi ${name}, your order #${orderId} has been successfully placed.
          </p>
          <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
            <h3 style="color: #5F613A; margin-top: 0;">Order Details</h3>
            <p><strong>Total Amount:</strong> ₹${orderDetails.totalAmount}</p>
            <p><strong>Payment Method:</strong> ${orderDetails.paymentMethod}</p>
            <p><strong>Payment Status:</strong> ${orderDetails.paymentStatus}</p>
          </div>
          <p style="color: #666; line-height: 1.6;">
            You'll receive another email when your order ships.
          </p>
        </div>
        <div style="background-color: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>&copy; 2024 Anantra Fashion. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  // Password reset
  passwordReset: (name: string, resetLink: string) => ({
    subject: 'Reset Your Password - Anantra Fashion',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #5F613A; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Anantra Fashion</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p style="color: #666; line-height: 1.6;">
            Hi ${name}, we received a request to reset your password.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #5F613A; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #999; font-size: 12px; line-height: 1.6;">
            If you didn't request this password reset, please ignore this email. 
            This link will expire in 1 hour.
          </p>
        </div>
        <div style="background-color: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>&copy; 2024 Anantra Fashion. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  // Contact form submission
  contactForm: (name: string, email: string, message: string) => ({
    subject: 'New Contact Form Submission',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #5F613A; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Anantra Fashion</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          <div style="margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p style="background-color: #fff; padding: 15px; border-left: 4px solid #5F613A; margin: 10px 0;">
              ${message}
            </p>
          </div>
        </div>
        <div style="background-color: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>&copy; 2024 Anantra Fashion. All rights reserved.</p>
        </div>
      </div>
    `
  })
}

// Helper function to send templated emails
export async function sendTemplatedEmail(
  to: string | string[],
  template: keyof typeof emailTemplates,
  templateData: any
) {
  const emailFunction: any = emailTemplates[template]
  if (!emailFunction) {
    throw new Error(`Email template '${template}' not found`)
  }

  const emailContent = emailFunction(templateData)
  
  return sendEmail({
    to,
    ...emailContent
  })
}
