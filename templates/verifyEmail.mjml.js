const verifyEmailTemplate = ({ name, otp, verifyLink }) => `
<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Inter, Arial, sans-serif" />
      <mj-text font-size="16px" color="#e2e8f0" line-height="1.6" />
    </mj-attributes>
  </mj-head>

  <mj-body background-color="#0f0f1a">

    <!-- header -->
    <mj-section background-color="#1a1a2e" padding="30px">
      <mj-column>
        <mj-text font-size="28px" font-weight="700" color="#ffffff" align="center">
          🔍 Lost & Found
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- main content -->
    <mj-section background-color="#16213e" padding="40px 30px">
      <mj-column>

        <mj-text font-size="24px" font-weight="700" color="#ffffff" align="center" padding-bottom="16px">
          Verify Your Email Address
        </mj-text>

        <mj-text align="center" padding-bottom="24px">
          Hi <strong>${name}</strong>, welcome to Lost & Found!
          Please verify your email address to get started.
        </mj-text>

        <!-- OTP code box -->
        <mj-text align="center" padding-bottom="8px" color="#a0aec0">
          Your verification code is:
        </mj-text>

        <mj-text
          align="center"
          font-size="42px"
          font-weight="900"
          color="#8b5cf6"
          padding-bottom="8px"
        >
          ${otp}
        </mj-text>

        <mj-text align="center" color="#a0aec0" font-size="14px" padding-bottom="32px">
          This code expires in <strong>15 minutes</strong>
        </mj-text>

        <!-- divider -->
        <mj-divider border-color="#2d3748" padding-bottom="32px" />

        <!-- verify link button -->
        <mj-text align="center" padding-bottom="16px" color="#a0aec0">
          Or click the button below to verify instantly:
        </mj-text>

        <mj-button
          background-color="#8b5cf6"
          color="#ffffff"
          font-size="16px"
          font-weight="600"
          padding="14px 32px"
          border-radius="8px"
          href="${verifyLink}"
        >
          ✅ Verify My Email
        </mj-button>

        <mj-text align="center" font-size="12px" color="#718096" padding-top="24px">
          If you didn't create an account, you can safely ignore this email.
        </mj-text>

      </mj-column>
    </mj-section>

    <!-- footer -->
    <mj-section background-color="#1a1a2e" padding="20px">
      <mj-column>
        <mj-text align="center" font-size="12px" color="#718096">
          © 2026 Lost & Found Portal. All rights reserved.
        </mj-text>
      </mj-column>
    </mj-section>

  </mj-body>
</mjml>
`;

export default verifyEmailTemplate;