const connectionNotificationTemplate = ({ name, status, oppositeUserName, lostItemName, foundItemName }) => `
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
          ${status === 'accepted' ? '✅ Connection Accepted!' : '❌ Connection Rejected'}
        </mj-text>

        <mj-text align="center" padding-bottom="24px">
          Hi <strong>${name}</strong>,
          ${status === 'accepted'
            ? `your connection request with <strong>${oppositeUserName}</strong> has been accepted.`
            : `your connection request with <strong>${oppositeUserName}</strong> has been rejected.`
          }
        </mj-text>

        <!-- item names -->
        <mj-text align="center" color="#a0aec0" padding-bottom="8px">
          Item involved:
        </mj-text>
        <mj-text align="center" font-size="18px" font-weight="700" color="#8b5cf6" padding-bottom="24px">
          ${lostItemName} 🔗 ${foundItemName}
        </mj-text>

        ${status === 'accepted' ? `
        <mj-text align="center" padding-bottom="32px">
          You can now visit the Connections page to view contact details and connect via Gmail.
        </mj-text>
        <mj-button
          background-color="#8b5cf6"
          color="#ffffff"
          font-size="16px"
          font-weight="600"
          padding="14px 32px"
          border-radius="8px"
          href="${process.env.APP_URL}/connections"
        >
          View Connection
        </mj-button>
        ` : `
        <mj-text align="center" color="#a0aec0" padding-bottom="32px">
          You can browse more items or submit a new report at any time.
        </mj-text>
        `}

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

export default connectionNotificationTemplate;