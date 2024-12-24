import { jsPDF } from 'jspdf';

export async function POST(request: Request) {
  try {
    let data;
    try {
      data = await request.json();
    } catch (parseError) {
      console.error('Request JSON Parse Error:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { analysis, transcript } = data;

    if (!analysis || !transcript) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPosition = margin;

    // Helper for section headers with separator line
    const addSectionHeader = (text: string) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0);
      doc.text(text, margin, yPosition);
      yPosition += 10;
      // Add separator line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;
    };

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('Performance Analysis', margin, yPosition);
    yPosition += 15;

    // Date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 25;

    // Scores Section
    analysis.scores.forEach((score: any) => {
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = margin;
      }

      // Score box
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(margin, yPosition, maxWidth, 45, 3, 3, 'F');

      // Category and score in same line
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(score.category, margin + 5, yPosition + 15);
      doc.text(`${score.score}/100`, pageWidth - margin - 30, yPosition + 15);

      // Description with less spacing
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      const description = doc.splitTextToSize(score.description, maxWidth - 20);
      description.forEach((line: string, index: number) => {
        doc.text(line, margin + 5, yPosition + 30 + (index * 5));
      });

      yPosition += 55; // Reduced spacing between score boxes
    });

    // Conversation Insights
    yPosition += 10;
    doc.addPage();
    yPosition = margin;
    addSectionHeader('Conversation Insights');

    analysis.insights.forEach((insight: any) => {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = margin;
        }
      
        // Quote box - adjust height based on content
        const quoteLines = doc.splitTextToSize(`"${insight.message}"`, maxWidth - 20);
        const lineHeight = 5; // Line height for text
        const verticalPadding = 8; // Padding for top and bottom
        const quoteHeight = (quoteLines.length * lineHeight) + (verticalPadding * 2);
        
        // Draw quote box
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(margin, yPosition, maxWidth, quoteHeight, 3, 3, 'F');
        
        // Quote text - left aligned with even vertical spacing
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        
        quoteLines.forEach((line: string, index: number) => {
          const textY = yPosition + verticalPadding + (index * lineHeight) + 3; // Reduced baseline offset from 5 to 3
          doc.text(line, margin + 10, textY);
        });
        yPosition += quoteHeight + 15;
      
        // Suggestion - adjust height based on content
        const suggestionLines = doc.splitTextToSize(insight.suggestion, maxWidth - 10);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        suggestionLines.forEach((line: string, index: number) => {
          doc.text(line, margin + 5, yPosition + (index * 7));
        });
        yPosition += (suggestionLines.length * 7) + 20;
      });

    // Transcript Section
    doc.addPage();
    yPosition = margin;
    addSectionHeader('Conversation Transcript');

    // Use monospace font for transcript
    const messages = transcript.split('\n');
    messages.forEach((message: string) => {
      if (message.trim()) {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFont('courier', 'normal');
        doc.setFontSize(10); // Smaller font size for transcript
        doc.setTextColor(0, 0, 0); // Single black color for all text
        
        const lines = doc.splitTextToSize(message, maxWidth);
        lines.forEach((line: string, index: number) => {
          doc.text(line, margin, yPosition + (index * 4));
        });
        
        yPosition += (lines.length * 4) + 4;
      }
    });

    // Finalize PDF
    const pdfBuffer = doc.output('arraybuffer');

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=sales-evaluation-${new Date().toISOString().split('T')[0]}.pdf`,
      },
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate PDF', details: error || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}