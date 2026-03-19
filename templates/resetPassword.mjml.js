const resetPasswordTemplate = ({ name, otp, resetLink }) => `
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
          Reset Your Password
        </mj-text>

        <mj-text align="center" padding-bottom="24px">
          Hi <strong>${name}</strong>, we received a request to reset your Lost & Found password.
        </mj-text>

        <!-- OTP code box -->
        <mj-text align="center" padding-bottom="8px" color="#a0aec0">
          Your reset code is:
        </mj-text>

        <mj-text
          align="center"
          font-size="42px"
          font-weight="900"
          color="#06b6d4"
          padding-bottom="8px"
        >
          ${otp}
        </mj-text>

        <mj-text align="center" color="#a0aec0" font-size="14px" padding-bottom="32px">
          This code expires in <strong>15 minutes</strong>
        </mj-text>

        <!-- divider -->
        <mj-divider border-color="#2d3748" padding-bottom="32px" />

        <!-- reset link button -->
        <mj-text align="center" padding-bottom="16px" color="#a0aec0">
          Or click the button below to reset instantly:
        </mj-text>

        <mj-button
          background-color="#06b6d4"
          color="#ffffff"
          font-size="16px"
          font-weight="600"
          padding="14px 32px"
          border-radius="8px"
          href="${resetLink}"
        >
          🔐 Reset My Password
        </mj-button>

        <mj-text align="center" font-size="12px" color="#718096" padding-top="24px">
          If you didn't request a password reset, you can safely ignore this email.
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

export default resetPasswordTemplate;