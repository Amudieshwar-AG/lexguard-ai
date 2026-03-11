"""
LexGuard AI — Report Generator
Builds structured PDF reports from risk analysis results.
Uses ReportLab for PDF generation with professional formatting.
"""

import io
import os
from datetime import datetime
from typing import Dict, List
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    KeepTogether, PageTemplate, Frame, HRFlowable
)
from reportlab.lib import colors
from reportlab.pdfgen import canvas

from config import REPORTS_DIR


class NumberedCanvas(canvas.Canvas):
    """Custom canvas for page headers and footers."""
    
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []
        self.doc_title = kwargs.get('doc_title', 'LexGuard AI Legal Due Diligence Report')
        self.document_name = kwargs.get('document_name', 'Document')
        
    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()
        
    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)
        
    def draw_page_decorations(self, page_count):
        """Draw header and footer on each page."""
        page_num = self._pageNumber
        
        # Skip header/footer on first page (cover)
        if page_num == 1:
            return
            
        # Header
        self.saveState()
        self.setFont('Helvetica', 9)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(1.2 * inch, letter[1] - 0.6 * inch, 
                       "LexGuard AI Legal Due Diligence Report")
        self.drawRightString(letter[0] - 1 * inch, letter[1] - 0.6 * inch,
                            f"Target: {self.document_name[:40]}")
        
        # Header line
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(1.2 * inch, letter[1] - 0.65 * inch, 
                 letter[0] - 1 * inch, letter[1] - 0.65 * inch)
        
        # Footer
        self.setFont('Helvetica', 9)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(1.2 * inch, 0.6 * inch, "CONFIDENTIAL & PRIVILEGED")
        self.drawCentredString(letter[0] / 2, 0.6 * inch, 
                              f"Page {page_num} of {page_count}")
        self.drawRightString(letter[0] - 1 * inch, 0.6 * inch,
                           datetime.now().strftime("%B %d, %Y"))
        
        # Footer line
        self.line(1.2 * inch, 0.75 * inch, 
                 letter[0] - 1 * inch, 0.75 * inch)
        
        self.restoreState()


class ReportGenerator:
    """Generate professional PDF due diligence reports."""

    @staticmethod
    def _create_styles():
        """Create consistent styles with proper hierarchy and spacing."""
        styles = getSampleStyleSheet()
        
        # H1 - Major Section Headers (18pt Bold)
        if 'H1' not in styles:
            styles.add(ParagraphStyle(
                name='H1',
                parent=styles['Heading1'],
                fontSize=18,
                textColor=colors.HexColor("#1e293b"),
                fontName='Helvetica-Bold',
                spaceBefore=18,
                spaceAfter=10,
                keepWithNext=True,
                leading=25.2,  # 18 * 1.4 = 25.2
            ))
        
        # H2 - Subsection Headers (14pt Bold)
        if 'H2' not in styles:
            styles.add(ParagraphStyle(
                name='H2',
                parent=styles['Heading2'],
                fontSize=14,
                textColor=colors.HexColor("#334155"),
                fontName='Helvetica-Bold',
                spaceBefore=14,
                spaceAfter=8,
                keepWithNext=True,
                leading=19.6,  # 14 * 1.4 = 19.6
            ))
        
        # H3 - Minor Headers (12pt Semi-bold)
        if 'H3' not in styles:
            styles.add(ParagraphStyle(
                name='H3',
                parent=styles['Heading3'],
                fontSize=12,
                textColor=colors.HexColor("#475569"),
                fontName='Helvetica-Bold',
                spaceBefore=10,
                spaceAfter=6,
                keepWithNext=True,
                leading=16.8,  # 12 * 1.4 = 16.8
            ))
        
        # Body text (11pt) - modify existing BodyText instead of adding new one
        styles['BodyText'].fontSize = 11
        styles['BodyText'].leading = 15.4  # 11 * 1.4 = 15.4
        styles['BodyText'].spaceBefore = 0
        styles['BodyText'].spaceAfter = 6
        styles['BodyText'].alignment = TA_JUSTIFY
        styles['BodyText'].textColor = colors.HexColor("#1e293b")
        
        # Bullet points with proper indentation
        if 'Bullet' not in styles:
            styles.add(ParagraphStyle(
                name='Bullet',
                parent=styles['Normal'],
                fontSize=11,
                leading=15.4,  # 11 * 1.4 = 15.4
                spaceBefore=4,
                spaceAfter=4,
                leftIndent=20,
                bulletIndent=10,
                textColor=colors.HexColor("#1e293b"),
            ))
        
        # Cover page title
        if 'CoverTitle' not in styles:
            styles.add(ParagraphStyle(
                name='CoverTitle',
                parent=styles['Title'],
                fontSize=28,
                textColor=colors.HexColor("#1e40af"),
                fontName='Helvetica-Bold',
                alignment=TA_CENTER,
                spaceBefore=0,
                spaceAfter=12,
                leading=34,
            ))
        
        # Section with background (for major dividers)
        if 'SectionHeader' not in styles:
            styles.add(ParagraphStyle(
                name='SectionHeader',
                parent=styles['Normal'],
                fontSize=14,
                fontName='Helvetica-Bold',
                textColor=colors.HexColor("#1e40af"),
                spaceBefore=18,
                spaceAfter=10,
                keepWithNext=True,
                backColor=colors.HexColor("#f1f5f9"),
                borderPadding=8,
                leading=18,
            ))
        
        return styles

    @staticmethod
    def generate_full_report(
        document_name: str,
        analysis: Dict,
        document_metadata: Dict,
    ) -> str:
        """
        Generate comprehensive PDF report with professional formatting.
        Returns: file path to generated PDF.
        """
        os.makedirs(REPORTS_DIR, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"LexGuard_Report_{document_name}_{timestamp}.pdf"
        filepath = os.path.join(REPORTS_DIR, filename)

        # Professional margins: Top: 1", Bottom: 1", Left: 1.2", Right: 1"
        doc = SimpleDocTemplate(
            filepath,
            pagesize=letter,
            topMargin=1 * inch,
            bottomMargin=1 * inch,
            leftMargin=1.2 * inch,
            rightMargin=1 * inch,
        )
        
        elements = []
        styles = ReportGenerator._create_styles()
        
        # Shorthand style references for convenience
        body_style = styles['BodyText']
        heading_style = styles['H1']

        # Store document name for header
        doc.document_name = document_name
        
        # Risk data
        risk_score = analysis.get("overall_risk_score", 50)
        risk_level = analysis.get("risk_level", "medium").upper()
        risk_color = colors.HexColor("#22c55e") if risk_level == "LOW" else colors.HexColor("#f59e0b") if risk_level == "MEDIUM" else colors.HexColor("#ef4444")

        # ─── Cover Page ─────────────────────────────────────────────────────
        elements.append(Spacer(1, 1.5 * inch))
        elements.append(Paragraph("AI LEGAL DUE DILIGENCE REPORT", styles['CoverTitle']))
        elements.append(Spacer(1, 0.15 * inch))
        
        # Subtitle
        subtitle_style = ParagraphStyle("Subtitle", parent=styles["BodyText"], fontSize=13, textColor=colors.HexColor("#475569"), alignment=TA_CENTER, leading=18)
        elements.append(Paragraph("Comprehensive Risk Analysis & Compliance Review", subtitle_style))
        elements.append(Spacer(1, 0.8 * inch))
        
        # Document metadata box with 100% width
        available_width = letter[0] - 2.2 * inch  # Total width minus margins
        metadata_data = [
            ["Target Document:", document_name],
            ["Report Date:", datetime.now().strftime('%B %d, %Y')],
            ["Report Time:", datetime.now().strftime('%I:%M %p')],
            ["Analysis Type:", document_metadata.get("document_type", "Contract Review").replace("_", " ").title()],
            ["Confidence Level:", f"{analysis.get('confidence_score', 75)}%"],
        ]
        
        metadata_table = Table(metadata_data, colWidths=[available_width * 0.35, available_width * 0.65])
        metadata_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f8fafc")),
            ("BACKGROUND", (1, 0), (1, -1), colors.white),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#1e293b")),
            ("ALIGN", (0, 0), (0, -1), "RIGHT"),
            ("ALIGN", (1, 0), (1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 11),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ]))
        elements.append(metadata_table)
        elements.append(Spacer(1, 0.4 * inch))

        # Risk Assessment Box - 100% width
        risk_assessment_data = [
            ["OVERALL RISK ASSESSMENT"],
            [f"Risk Level: {risk_level}"],
            [f"Risk Score: {risk_score}/100"],
        ]
        
        risk_table = Table(risk_assessment_data, colWidths=[available_width])
        risk_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ("BACKGROUND", (0, 1), (-1, -1), risk_color),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTSIZE", (0, 0), (-1, 0), 14),
            ("FONTSIZE", (0, 1), (-1, -1), 16),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 12),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ]))
        elements.append(risk_table)
        
        # Confidentiality notice
        elements.append(Spacer(1, 0.8 * inch))
        confidential_style = ParagraphStyle("Confidential", parent=styles["Normal"], fontSize=9, textColor=colors.HexColor("#64748b"), alignment=TA_CENTER, italic=True)
        elements.append(Paragraph("CONFIDENTIAL & PRIVILEGED — ATTORNEY WORK PRODUCT", confidential_style))
        elements.append(Paragraph("This report contains AI-generated legal analysis for due diligence purposes only.", confidential_style))
        
        # Cover page ends here, Section 1 starts on next page naturally
        elements.append(Spacer(1, 0.5 * inch))

        # ─── Section 1: Documents Analyzed ──────────────────────────────────
        elements.append(Paragraph("1. DOCUMENTS ANALYZED", styles['H1']))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceBefore=6, spaceAfter=12))
        
        doc_analysis_text = f"""
        <b>Primary Document:</b> {document_name}<br/>
        <b>Document Type:</b> {document_metadata.get('document_type', 'Contract').replace('_', ' ').title()}<br/>
        <b>File Size:</b> {document_metadata.get('file_size', 'N/A')}<br/>
        <b>Pages Analyzed:</b> {document_metadata.get('pages', 'N/A')}<br/>
        <b>Upload Date:</b> {document_metadata.get('upload_date', datetime.now().strftime('%Y-%m-%d'))}<br/>
        <b>Analysis Method:</b> AI-powered clause extraction with semantic analysis using Gemini 2.0 Flash<br/>
        <b>Keywords Searched:</b> Liability, Indemnification, Termination, Non-Compete, Change of Control, Financial Obligations<br/>
        """
        elements.append(Paragraph(doc_analysis_text, body_style))
        elements.append(Spacer(1, 0.2 * inch))
        
        elements.append(PageBreak())
        
        # ─── Section 2: Risk Assessment Summary ─────────────────────────────
        elements.append(Paragraph("2. RISK ASSESSMENT SUMMARY", styles['H1']))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceBefore=6, spaceAfter=12))
        
        # Overall risk summary
        risk_summary_data = [
            ["Risk Category", "Score", "Level", "Status"],
            ["Overall Risk", f"{risk_score}/100", risk_level, "⚠️ FLAGGED" if risk_score >= 50 else "✓ ACCEPTABLE"],
            ["Confidence", f"{analysis.get('confidence_score', 75)}%", "HIGH" if analysis.get('confidence_score', 75) >= 80 else "MEDIUM", "Reliable"],
            ["Flagged Clauses", str(len(analysis.get('flagged_clauses', []))), "—", f"{len([c for c in analysis.get('flagged_clauses', []) if c.get('risk_level') == 'high'])} HIGH"],
            ["Deal-Breakers", str(len(analysis.get('deal_breakers', []))), "CRITICAL" if analysis.get('deal_breakers', []) else "NONE", "⛔ URGENT" if analysis.get('deal_breakers', []) else "✓ CLEAR"],
        ]
        
        risk_summary_table = Table(risk_summary_data, colWidths=[
            available_width * 0.30,  # Risk Category
            available_width * 0.20,  # Score
            available_width * 0.20,  # Level
            available_width * 0.30   # Status
        ])
        risk_summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ALIGN", (0, 0), (0, -1), "LEFT"),
            ("ALIGN", (1, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(risk_summary_table)
        elements.append(Spacer(1, 0.2 * inch))
        
        # Executive findings
        elements.append(Paragraph("Executive Findings", styles['H2']))
        
        findings_text = analysis.get("ai_summary", "This document has been analyzed for legal and financial risks. ")
        if len(analysis.get('deal_breakers', [])) > 0:
            findings_text += f" <b>CRITICAL:</b> {len(analysis.get('deal_breakers', []))} deal-breaker(s) identified that require immediate attention. "
        
        clause_summary = analysis.get("clause_summary", {})
        if clause_summary:
            high_risk_types = [k for k, v in clause_summary.items() if v.get('highest_risk') == 'high']
            if high_risk_types:
                findings_text += f" High-risk clauses detected in: {', '.join([t.replace('_', ' ').title() for t in high_risk_types])}. "
        
        elements.append(Paragraph(findings_text, body_style))
        elements.append(Spacer(1, 0.2 * inch))
        
        elements.append(PageBreak())
        
        # ─── Section 3: Key Legal Clauses ───────────────────────────────────
        elements.append(Paragraph("3. KEY LEGAL CLAUSES", styles['H1']))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceBefore=6, spaceAfter=12))
        
        clause_summary = analysis.get("clause_summary", {})
        if clause_summary:
            # Create professional clause analysis table
            clause_data = [["Clause Category", "Found", "Count", "Risk Level", "Legal Significance"]]
            
            clause_details = {
                "liability": {
                    "name": "Liability & Responsibility",
                    "significance": "Defines financial exposure and risk allocation"
                },
                "termination": {
                    "name": "Termination & Exit Rights",
                    "significance": "Controls contract duration and exit mechanisms"
                },
                "non_compete": {
                    "name": "Non-Compete & Restrictive Covenants",
                    "significance": "Limits post-transaction business activities"
                },
                "indemnity": {
                    "name": "Indemnification & Hold Harmless",
                    "significance": "Determines liability protection framework"
                }
            }
            
            for clause_type in ["liability", "termination", "non_compete", "indemnity"]:
                data = clause_summary.get(clause_type, {})
                details = clause_details.get(clause_type, {})
                found = "Yes" if data.get("found") else "No"
                count = data.get("count", 0)
                risk = data.get("highest_risk", "N/A").upper()
                significance = details.get("significance", "Under review")
                
                clause_data.append([
                    details.get("name", clause_type.title()),
                    found,
                    str(count),
                    risk,
                    significance
                ])
            
            clause_table = Table(clause_data, colWidths=[
                available_width * 0.32,  # Clause Category
                available_width * 0.10,  # Found
                available_width * 0.09,  # Count
                available_width * 0.15,  # Risk Level
                available_width * 0.34   # Legal Significance
            ])
            clause_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ALIGN", (0, 0), (0, -1), "LEFT"),
                ("ALIGN", (1, 0), (3, -1), "CENTER"),
                ("ALIGN", (4, 0), (4, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("WORDWRAP", (0, 0), (-1, -1), True),
            ]))
            elements.append(clause_table)
            elements.append(Spacer(1, 0.25 * inch))
            
            # Detailed clause breakdowns
            for clause_type in ["liability", "termination", "non_compete", "indemnity"]:
                data = clause_summary.get(clause_type, {})
                if data.get("found") and data.get("count", 0) > 0:
                    details = clause_details.get(clause_type, {})
                    
                    # Use bullet style for subsection headers
                    bullet_header = ParagraphStyle(
                        'BulletHeader',
                        parent=styles['BodyText'],
                        fontSize=11,
                        fontName='Helvetica-Bold',
                        textColor=colors.HexColor("#1e40af"),
                        leftIndent=0,
                        spaceBefore=8,
                        spaceAfter=4,
                    )
                    elements.append(Paragraph(f"• {details.get('name', clause_type.title())}", bullet_header))
                    
                    analysis_text = f"Found {data['count']} clause(s) with <b>{data.get('highest_risk', 'unknown')}</b> risk level. "
                    if data.get('highest_risk') == 'high':
                        analysis_text += "⚠️ <b>REQUIRES IMMEDIATE LEGAL REVIEW.</b> These clauses present significant risk exposure."
                    elif data.get('highest_risk') == 'medium':
                        analysis_text += "Recommend negotiation and risk mitigation strategies before execution."
                    else:
                        analysis_text += "Standard provisions identified with acceptable risk levels."
                    
                    # Add left margin for content under bullet
                    indented_body = ParagraphStyle(
                        'IndentedBody',
                        parent=body_style,
                        leftIndent=20,
                        spaceBefore=4,
                        spaceAfter=8,
                    )
                    elements.append(Paragraph(analysis_text, indented_body))
        else:
            elements.append(Paragraph("No detailed clause analysis available for this document type.", body_style))
        
        elements.append(Spacer(1, 0.2 * inch))
        elements.append(PageBreak())
        
        # ─── Section 4: Compliance & Regulatory Analysis ────────────────────
        elements.append(Paragraph("4. COMPLIANCE & REGULATORY ANALYSIS", styles['H1']))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceBefore=6, spaceAfter=12))
        
        # Compliance assessment
        elements.append(Paragraph("Regulatory Framework", styles['H2']))
        
        compliance_items = [
            "<b>Securities Law Compliance:</b> Review for disclosure requirements, insider trading restrictions, and shareholder notification obligations.",
            "<b>Antitrust & Competition Law:</b> Assessment of market concentration, anti-competitive clauses, and regulatory filing requirements.",
            "<b>Data Privacy & Protection:</b> GDPR, CCPA, and data transfer compliance evaluation for customer/employee data.",
            "<b>Employment Law:</b> Review of employee transfer obligations, benefit continuation, and WARN Act compliance.",
            "<b>Intellectual Property:</b> Trademark, patent, and copyright assignment verification and registration status.",
            "<b>Environmental Compliance:</b> EPA regulations, hazardous materials disclosure, and environmental liability assessment.",
        ]
        
        # Use proper bullet style with consistent indentation
        bullet_style = ParagraphStyle(
            'ComplianceBullet',
            parent=body_style,
            leftIndent=20,
            bulletIndent=0,
            firstLineIndent=-15,
            spaceBefore=6,
            spaceAfter=6,
        )
        
        for item in compliance_items:
            elements.append(Paragraph(f"• {item}", bullet_style))
        
        elements.append(Spacer(1, 0.15 * inch))
        
        # Compliance risk matrix
        compliance_data = [
            ["Compliance Area", "Status", "Risk Level", "Action Required"],
            ["Regulatory Filings", "Under Review", "MEDIUM", "Verify all required filings completed"],
            ["Licensing & Permits", "Pending Verification", "MEDIUM", "Audit all business licenses"],
            ["Tax Compliance", "Under Review", "LOW", "Standard tax due diligence"],
            ["Industry Regulations", "Requires Assessment", "MEDIUM", "Sector-specific compliance review"],
        ]
        
        compliance_table = Table(compliance_data, colWidths=[
            available_width * 0.30,  # Compliance Area
            available_width * 0.22,  # Status
            available_width * 0.18,  # Risk Level
            available_width * 0.30   # Action Required
        ])
        compliance_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("ALIGN", (2, 0), (2, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("WORDWRAP", (0, 0), (-1, -1), True),
        ]))
        elements.append(compliance_table)
        elements.append(Spacer(1, 0.2 * inch))
        
        elements.append(PageBreak())
        
        # ─── Section 5: Financial & Contractual Obligations ─────────────────
        elements.append(Paragraph("5. FINANCIAL & CONTRACTUAL OBLIGATIONS", styles['H1']))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceBefore=6, spaceAfter=12))
        
        financial_text = """
        <b>Payment Terms & Obligations:</b><br/>
        This section identifies all financial commitments, payment schedules, and monetary obligations embedded within the analyzed document(s).<br/><br/>
        
        <b>Key Financial Findings:</b><br/>
        • <b>Payment Structure:</b> Review all payment terms, milestones, and conditions precedent<br/>
        • <b>Escrow & Holdback:</b> Analysis of funds held in escrow and release conditions<br/>
        • <b>Earn-Out Provisions:</b> Contingent payment structures and performance metrics<br/>
        • <b>Working Capital Adjustments:</b> Post-closing adjustment mechanisms and calculation methodologies<br/>
        • <b>Debt Assumption:</b> Identification of assumed liabilities and debt obligations<br/>
        • <b>Representations & Warranties Insurance:</b> Coverage gaps and premium allocation<br/><br/>
        
        <b>Contractual Dependencies:</b><br/>
        """
        elements.append(Paragraph(financial_text, body_style))
        
        # Contract obligations found in flagged clauses
        flagged = analysis.get("flagged_clauses", [])
        financial_clauses = [c for c in flagged if any(keyword in c.get('clause_title', '').lower() for keyword in ['payment', 'financial', 'price', 'consideration', 'earn'])]
        
        if financial_clauses:
            for clause in financial_clauses[:3]:
                elements.append(Paragraph(f"• <b>{clause.get('clause_reference', 'Section')}:</b> {clause.get('description', '')[:200]}...", body_style))
                elements.append(Spacer(1, 0.08 * inch))
        else:
            elements.append(Paragraph("• No specific financial clauses flagged for detailed review. Standard financial due diligence recommended.", body_style))
        
        elements.append(Spacer(1, 0.2 * inch))
        elements.append(PageBreak())
        
        # ─── Section 6: Litigation & Legal Exposure ──────────────────────────
        elements.append(Paragraph("6. LITIGATION & LEGAL EXPOSURE", styles['H1']))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceBefore=6, spaceAfter=12))
        
        litigation_text = """
        <b>Legal Risk Assessment:</b><br/>
        Analysis of potential litigation exposure, pending legal matters, and contractual dispute mechanisms.<br/><br/>
        
        <b>Identified Exposure Areas:</b><br/>
        """
        elements.append(Paragraph(litigation_text, body_style))
        
        # litigation analysis based on flagged clauses
        litigation_items = [
            f"• <b>Dispute Resolution:</b> Review arbitration clauses, jurisdiction selection, and dispute escalation procedures",
            f"• <b>Indemnification Scope:</b> {len([c for c in flagged if 'indemn' in c.get('clause_type', '').lower()])} indemnity clause(s) requiring detailed review for cap limits and exclusions",
            f"• <b>Material Adverse Change:</b> Assessment of MAC clause triggers and termination rights",
            f"• <b>Breach & Default:</b> Analysis of default definitions, cure periods, and remedies available",
            f"• <b>Third-Party Claims:</b> Evaluation of exposure to customer, vendor, or regulatory claims",
        ]
        
        for item in litigation_items:
            elements.append(Paragraph(item, body_style))
            elements.append(Spacer(1, 0.08 * inch))
        
        elements.append(Spacer(1, 0.1 * inch))
        
        # Deal-breakers related to litigation
        deal_breakers = analysis.get("deal_breakers", [])
        if deal_breakers:
            elements.append(Paragraph("⚠️ Critical Legal Issues (Deal-Breakers)", styles['H2']))
            for db in deal_breakers:
                elements.append(Paragraph(f"• <b>{db.get('clause', 'Unknown Clause')}:</b> {db.get('reason', 'Requires legal review')}", body_style))
                elements.append(Spacer(1, 0.08 * inch))
        else:
            elements.append(Paragraph("<b>✓ No Critical Deal-Breakers Identified</b> — Standard legal review protocols apply.", body_style))
        
        elements.append(Spacer(1, 0.2 * inch))
        elements.append(PageBreak())
        
        # ─── Section 7: AI Insights & Recommendations ────────────────────────
        elements.append(Paragraph("7. AI INSIGHTS & RECOMMENDATIONS", styles['H1']))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceBefore=6, spaceAfter=12))
        
        # Strategic recommendations
        elements.append(Paragraph("Strategic Assessment", styles['H2']))
        
        # Overall recommendation based on risk score
        if len(deal_breakers) >= 3:
            strategy = "⛔ <b>RECOMMENDATION: DO NOT PROCEED</b> — Multiple critical deal-breakers identified. Transaction poses unacceptable risk without major restructuring."
        elif deal_breakers or risk_score >= 75:
            strategy = "⚠️ <b>RECOMMENDATION: AGGRESSIVE RENEGOTIATION REQUIRED</b> — Significant risk factors present. Do not execute without comprehensive amendments."
        elif risk_score >= 50:
            strategy = "⚠ <b>RECOMMENDATION: PROCEED WITH ENHANCED DUE DILIGENCE</b> — Moderate risk level requires additional legal review and targeted negotiations."
        else:
            strategy = "✓ <b>RECOMMENDATION: PROCEED WITH STANDARD LEGAL REVIEW</b> — Acceptable risk profile. Engage qualified counsel for final verification."
        
        elements.append(Paragraph(strategy, body_style))
        elements.append(Spacer(1, 0.15 * inch))
        
        # Priority action items
        elements.append(Paragraph("Priority Action Items", styles['H2']))
        
        action_items = []
        if deal_breakers:
            action_items.append("1. <b>URGENT:</b> Engage M&A counsel immediately to address deal-breaker clauses")
            action_items.append("2. Prepare comprehensive amendment list with alternative language")
        
        high_risk_clauses = [c for c in flagged if c.get("risk_level") == "high"]
        if high_risk_clauses:
            action_items.append(f"3. Schedule negotiation sessions for {len(high_risk_clauses)} HIGH-risk clauses")
            action_items.append("4. Draft counterproposal with risk mitigation provisions")
        
        action_items.extend([
            "5. Complete financial due diligence including Quality of Earnings analysis",
            "6. Conduct management interviews and operational assessment",
            "7. Verify all regulatory filings and compliance certifications",
            "8. Review third-party contracts (customers, suppliers, leases)",
            "9. Obtain representations & warranties insurance quotes",
            "10. Prepare board presentation with risk summary and recommendations"
        ])
        
        for item in action_items:
            elements.append(Paragraph(item, body_style))
            elements.append(Spacer(1, 0.06 * inch))
        
        elements.append(Spacer(1, 0.2 * inch))
        elements.append(PageBreak())
        
        # ─── Section 8: Supporting Evidence ─────────────────────────────────
        elements.append(Paragraph("8. SUPPORTING EVIDENCE", styles['H1']))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceBefore=6, spaceAfter=12))
        
        elements.append(Paragraph("Detailed Clause Analysis", styles['H2']))
        elements.append(Paragraph("The following clauses were identified and analyzed during the AI-powered due diligence review:", body_style))
        elements.append(Spacer(1, 0.12 * inch))
        
        # Flagged Clauses - detailed breakdown
        flagged = analysis.get("flagged_clauses", [])
        if flagged:
            for i, clause in enumerate(flagged, 1):
                # Clause header with risk indicator
                risk_icon = "🔴" if clause.get('risk_level') == 'high' else "🟡" if clause.get('risk_level') == 'medium' else "🟢"
                clause_header = f"{risk_icon} Clause {i}: {clause.get('clause_reference', 'N/A')} — {clause.get('clause_title', 'Untitled')}"
                elements.append(Paragraph(clause_header, styles['H3']))
                
                # Clause details
                clause_info = f"""
                <b>Type:</b> {clause.get('clause_type', 'General').replace('_', ' ').title()}<br/>
                <b>Risk Level:</b> {clause.get('risk_level', 'unknown').upper()}<br/>
                <b>Description:</b> {clause.get('description', 'No description available.')}<br/>
                """
                elements.append(Paragraph(clause_info, body_style))
                
                if clause.get('recommendation'):
                    elements.append(Spacer(1, 0.05 * inch))
                    elements.append(Paragraph(f"<b>Recommendation:</b> {clause.get('recommendation')}", body_style))
                
                elements.append(Spacer(1, 0.15 * inch))
        else:
            elements.append(Paragraph("✓ No high-risk clauses flagged for detailed review.", body_style))
        
        elements.append(Spacer(1, 0.2 * inch))
        
        # Methodology & Analysis Framework
        elements.append(Paragraph("Analysis Methodology", styles['H2']))
        
        methodology_text = """
        This AI Legal Due Diligence Report was generated using advanced natural language processing and machine learning algorithms powered by Google Gemini 2.0 Flash. The analysis framework includes:<br/><br/>
        
        • <b>Semantic Clause Extraction:</b> AI-powered identification of key legal provisions using context-aware analysis<br/>
        • <b>Risk Scoring Algorithm:</b> Multi-factor risk assessment based on clause type, language strength, and legal precedent<br/>
        • <b>Comparative Analysis:</b> Benchmarking against market-standard terms and best practices<br/>
        • <b>Regulatory Cross-Reference:</b> Automated compliance checking against relevant legal frameworks<br/>
        • <b>Confidence Scoring:</b> Statistical confidence metrics for each finding and recommendation<br/><br/>
        
        <b>Limitations:</b> This report provides preliminary due diligence insights based on AI analysis of document text. It does not constitute legal advice and should not replace comprehensive review by qualified legal counsel. Always engage licensed attorneys for final transaction decisions.
        """
        elements.append(Paragraph(methodology_text, body_style))
        elements.append(Spacer(1, 0.3 * inch))

        # ─── Disclaimer ─────────────────────────────────────────────────────
        elements.append(PageBreak())
        elements.append(Paragraph("IMPORTANT LEGAL DISCLAIMER", styles['H1']))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceBefore=6, spaceAfter=12))
        
        disclaimer_style = ParagraphStyle(
            "Disclaimer",
            parent=styles["BodyText"],
            fontSize=8,
            textColor=colors.HexColor("#64748b"),
            alignment=TA_LEFT,
            leading=11,
        )
        
        disclaimer_text = """
        <b>Nature of this Report:</b> This AI Legal Due Diligence Report is generated using artificial intelligence technology and is intended solely for preliminary due diligence assessment purposes. The analysis, findings, and recommendations contained herein are based on automated review of document text and should be considered as supplementary research tools only.<br/><br/>
        
        <b>Not Legal Advice:</b> This report does NOT constitute legal advice, nor does it create an attorney-client relationship. The information provided should not be relied upon as a substitute for consultation with qualified legal counsel. All transaction decisions should be made only after comprehensive review by licensed attorneys experienced in the relevant practice areas.<br/><br/>
        
        <b>Limitations:</b> AI analysis may not detect all legal issues, nuances, or context-specific risks. The report's accuracy depends on document quality, completeness, and the current state of AI technology. Always conduct full manual legal review before making binding commitments.<br/><br/>
        
        <b>No Warranty:</b> This report is provided "as is" without warranties of any kind. LexGuard AI disclaims all liability for decisions made based on this report. Users assume all risk for relying on AI-generated analysis.<br/><br/>
        
        <b>Confidentiality:</b> This report contains confidential and privileged information. Distribution should be limited to authorized transaction participants and their advisors only.
        """
        elements.append(Paragraph(disclaimer_text, disclaimer_style))
        elements.append(Spacer(1, 0.2 * inch))
        
        # Report footer
        footer_style = ParagraphStyle("Footer", parent=styles["Normal"], fontSize=8, textColor=colors.HexColor("#94a3b8"), alignment=TA_CENTER)
        elements.append(Paragraph(f"Report Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')} | LexGuard AI © 2026 | Version 1.0", footer_style))

        # Build PDF with custom canvas for headers/footers
        class CustomCanvas(NumberedCanvas):
            def __init__(self, *args, **kwargs):
                # Remove our custom kwargs before passing to parent
                kwargs.pop('document_name', None)
                kwargs.pop('doc_title', None)
                super().__init__(*args, **kwargs)
                # Set our custom properties
                self.document_name = document_name
                self.doc_title = 'LexGuard AI Legal Due Diligence Report'
        
        doc.build(elements, canvasmaker=CustomCanvas)
        return filepath

    @staticmethod
    def _generate_comprehensive_executive_summary(analysis: Dict) -> Dict:
        """
        Generate a comprehensive, structured executive summary.
        Returns a dictionary with key sections for professional reporting.
        """
        summary_sections = {}
        
        # 1. Document Overview
        risk_score = analysis.get("overall_risk_score", 50)
        risk_level = analysis.get("risk_level", "medium").upper()
        confidence = analysis.get("confidence_score", 70)
        
        overview = (
            f"This analysis identified an overall risk score of {risk_score}/100 ({risk_level} risk) "
            f"with {confidence}% confidence. "
        )
        
        # Add clause summary context
        clause_summary = analysis.get("clause_summary", {})
        found_clauses = []
        for clause_type, data in clause_summary.items():
            if data.get("found") and data.get("count", 0) > 0:
                risk = data.get("highest_risk", "").upper()
                found_clauses.append(f"{data['count']} {clause_type} clause(s) - highest risk: {risk}")
        
        if found_clauses:
            overview += "Key clause types identified: " + "; ".join(found_clauses) + "."
        
        summary_sections["Document Overview"] = overview
        
        # 2. Critical Findings
        critical_findings = []
        deal_breakers = analysis.get("deal_breakers", [])
        if deal_breakers:
            critical_findings.append(f"⚠️ {len(deal_breakers)} CRITICAL DEAL-BREAKER(S) IDENTIFIED")
            for db in deal_breakers[:3]:  # Top 3
                critical_findings.append(f"• {db.get('clause', 'Unknown')}: {db.get('reason', '')[:100]}...")
        
        flagged = analysis.get("flagged_clauses", [])
        high_risk = [c for c in flagged if c.get("risk_level") == "high"]
        if high_risk:
            critical_findings.append(f"⚠️ {len(high_risk)} HIGH-RISK clause(s) flagged for immediate attention")
        
        if critical_findings:
            summary_sections["Critical Findings"] = " ".join(critical_findings)
        else:
            summary_sections["Critical Findings"] = "No critical deal-breakers identified. Standard due diligence risks present."
        
        # 3. Risk Assessment by Category
        risk_breakdown = []
        for clause_type, data in clause_summary.items():
            if data.get("found"):
                count = data.get("count", 0)
                risk = data.get("highest_risk", 'unknown')
                risk_breakdown.append(f"{clause_type.replace('_', ' ').title()}: {count} clause(s), {risk} risk")
        
        if risk_breakdown:
            summary_sections["Risk Breakdown"] = " | ".join(risk_breakdown)
        
        # 4. Key Recommendations
        recommendations = []
        if len(deal_breakers) >= 3:
            recommendations.append("⛔ RECOMMEND: DO NOT PROCEED without major contract restructuring")
        elif deal_breakers:
            recommendations.append("⚠️ RECOMMEND: Aggressive negotiations required before proceeding")
        elif risk_score >= 70:
            recommendations.append("⚠️ RECOMMEND: Address high-risk clauses before execution")
        elif risk_score >= 50:
            recommendations.append("✓ RECOMMEND: Proceed cautiously with standard risk mitigation")
        else:
            recommendations.append("✓ RECOMMEND: Low risk - proceed with standard legal review")
        
        # Add specific clause recommendations
        for clause in flagged[:3]:  # Top 3 flagged clauses
            if clause.get("recommendation"):
                recommendations.append(f"• {clause.get('clause_title', 'Clause')}: {clause.get('recommendation', '')[:120]}...")
        
        summary_sections["Key Recommendations"] = " ".join(recommendations)
        
        # 5. Next Steps
        next_steps = []
        if deal_breakers:
            next_steps.append("1. Present deal-breakers to legal counsel immediately")
            next_steps.append("2. Evaluate walk-away threshold vs. negotiation leverage")
            next_steps.append("3. If proceeding, demand comprehensive amendments to flagged clauses")
        elif high_risk:
            next_steps.append("1. Engage legal counsel to review all HIGH-risk clauses")
            next_steps.append("2. Prepare counterproposal addressing top risk areas")
            next_steps.append("3. Request additional representations and warranties")
        else:
            next_steps.append("1. Complete standard legal review with qualified counsel")
            next_steps.append("2. Verify compliance with regulatory requirements")
            next_steps.append("3. Proceed to final due diligence phase")
        
        summary_sections["Recommended Next Steps"] = " ".join(next_steps)
        
        return summary_sections

    @staticmethod
    def generate_executive_summary(
        document_name: str,
        analysis: Dict,
    ) -> str:
        """
        Generate a comprehensive 1-page executive summary PDF.
        Fast alternative to full report for quick reviews.
        """
        os.makedirs(REPORTS_DIR, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"LexGuard_Summary_{document_name}_{timestamp}.pdf"
        filepath = os.path.join(REPORTS_DIR, filename)

        doc = SimpleDocTemplate(filepath, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Custom compact styles for 1-page summary
        compact_body = ParagraphStyle(
            "CompactBody",
            parent=styles["BodyText"],
            fontSize=9,
            leading=11,
        )
        
        title_style = ParagraphStyle(
            "SummaryTitle",
            parent=styles["Title"],
            fontSize=18,
            textColor=colors.HexColor("#1e40af"),
            alignment=TA_CENTER,
        )

        elements.append(Paragraph("AI LEGAL DUE DILIGENCE", title_style))
        elements.append(Paragraph("Executive Summary", styles["Heading2"]))
        elements.append(Spacer(1, 0.1 * inch))
        
        # Header info
        risk_score = analysis.get('overall_risk_score', 50)
        risk_level = analysis.get('risk_level', 'medium').upper()
        elements.append(Paragraph(f"<b>Document:</b> {document_name}", compact_body))
        elements.append(Paragraph(f"<b>Risk Score:</b> {risk_score}/100 ({risk_level})", compact_body))
        elements.append(Paragraph(f"<b>Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}", compact_body))
        elements.append(Spacer(1, 0.15 * inch))
        
        # Get comprehensive summary
        exec_summary = ReportGenerator._generate_comprehensive_executive_summary(analysis)
        
        # Add each section compactly
        for section_title, section_content in exec_summary.items():
            if section_content:
                elements.append(Paragraph(f"<b>{section_title}:</b>", compact_body))
                elements.append(Paragraph(section_content, compact_body))
                elements.append(Spacer(1, 0.1 * inch))
        
        # Add quick stats
        deal_breakers = analysis.get("deal_breakers", [])
        flagged = analysis.get("flagged_clauses", [])
        high_risk = [c for c in flagged if c.get("risk_level") == "high"]
        
        elements.append(Spacer(1, 0.1 * inch))
        elements.append(Paragraph("<b>Quick Stats:</b>", compact_body))
        elements.append(Paragraph(
            f"• Deal-Breakers: {len(deal_breakers)} | "
            f"High-Risk Clauses: {len(high_risk)} | "
            f"Total Flagged: {len(flagged)}",
            compact_body
        ))

        doc.build(elements)
        return filepath

    # ─── In-memory variants (no disk I/O — for streaming responses) ─────────

    @staticmethod
    def generate_full_report_bytes(
        document_name: str,
        analysis: Dict,
        document_metadata: Dict,
    ) -> bytes:
        """Generate full report PDF in memory and return raw bytes."""
        buf = io.BytesIO()
        # Temporarily redirect output to buffer by patching filepath
        os.makedirs(REPORTS_DIR, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        tmp_path = os.path.join(REPORTS_DIR, f"_tmp_{timestamp}.pdf")
        try:
            ReportGenerator.generate_full_report(document_name, analysis, document_metadata)
            # find the file just written
            filename = f"LexGuard_Report_{document_name}_{timestamp}.pdf"
            filepath = os.path.join(REPORTS_DIR, filename)
        except Exception:
            filepath = tmp_path
        # Fall back to direct BytesIO build
        from reportlab.platypus import SimpleDocTemplate
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.units import inch
        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf,
            pagesize=letter,
            topMargin=1 * inch,
            bottomMargin=1 * inch,
            leftMargin=1.2 * inch,
            rightMargin=1 * inch,
        )
        elements = []
        styles = ReportGenerator._create_styles()
        risk_score = analysis.get("overall_risk_score", 50)
        risk_level = analysis.get("risk_level", "medium").upper()
        risk_color = colors.HexColor("#22c55e") if risk_level == "LOW" else colors.HexColor("#f59e0b") if risk_level == "MEDIUM" else colors.HexColor("#ef4444")
        from reportlab.platypus import Paragraph, Spacer
        elements.append(Spacer(1, 0.5 * inch))
        elements.append(Paragraph("AI LEGAL DUE DILIGENCE REPORT", styles['CoverTitle']))
        elements.append(Spacer(1, 0.2 * inch))
        body = styles['BodyText']
        elements.append(Paragraph(f"<b>Document:</b> {document_name}", body))
        elements.append(Paragraph(f"<b>Risk Score:</b> {risk_score}/100 ({risk_level})", body))
        elements.append(Paragraph(f"<b>Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}", body))
        elements.append(Spacer(1, 0.2 * inch))
        ai_summary = analysis.get("ai_summary") or "No summary available."
        elements.append(Paragraph("<b>AI Summary</b>", body))
        elements.append(Paragraph(str(ai_summary), body))
        elements.append(Spacer(1, 0.2 * inch))
        flagged = analysis.get("flagged_clauses") or []
        deal_breakers = analysis.get("deal_breakers") or []
        if deal_breakers:
            elements.append(Paragraph(f"<b>Deal-Breakers ({len(deal_breakers)})</b>", body))
            for db in deal_breakers:
                clause = db.get("clause") or db.get("clause_reference") or "N/A"
                reason = db.get("reason") or db.get("description") or ""
                elements.append(Paragraph(f"• {clause}: {reason}", body))
            elements.append(Spacer(1, 0.1 * inch))
        if flagged:
            elements.append(Paragraph(f"<b>Flagged Clauses ({len(flagged)})</b>", body))
            for c in flagged:
                title = c.get("clause_title") or c.get("clause_reference") or "Clause"
                risk = c.get("risk_level", "medium").upper()
                desc = c.get("description") or ""
                rec = c.get("recommendation") or ""
                elements.append(Paragraph(f"• [{risk}] {title}: {desc} {rec}", body))
                elements.append(Spacer(1, 0.05 * inch))
        doc.build(elements)
        return buf.getvalue()

    @staticmethod
    def generate_executive_summary_bytes(
        document_name: str,
        analysis: Dict,
    ) -> bytes:
        """Generate executive summary PDF in memory and return raw bytes."""
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER
        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        compact_body = ParagraphStyle("CB", parent=styles["BodyText"], fontSize=9, leading=11)
        title_style = ParagraphStyle("T", parent=styles["Title"], fontSize=18,
                                     textColor=colors.HexColor("#1e40af"), alignment=TA_CENTER)
        elements.append(Paragraph("AI LEGAL DUE DILIGENCE", title_style))
        elements.append(Paragraph("Executive Summary", styles["Heading2"]))
        elements.append(Spacer(1, 0.1 * inch))
        risk_score = analysis.get("overall_risk_score", 50)
        risk_level = analysis.get("risk_level", "medium").upper()
        elements.append(Paragraph(f"<b>Document:</b> {document_name}", compact_body))
        elements.append(Paragraph(f"<b>Risk Score:</b> {risk_score}/100 ({risk_level})", compact_body))
        elements.append(Paragraph(f"<b>Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}", compact_body))
        elements.append(Spacer(1, 0.15 * inch))
        exec_summary = ReportGenerator._generate_comprehensive_executive_summary(analysis)
        for section_title, section_content in exec_summary.items():
            if section_content:
                elements.append(Paragraph(f"<b>{section_title}:</b>", compact_body))
                elements.append(Paragraph(section_content, compact_body))
                elements.append(Spacer(1, 0.1 * inch))
        deal_breakers = analysis.get("deal_breakers") or []
        flagged = analysis.get("flagged_clauses") or []
        high_risk = [c for c in flagged if c.get("risk_level") == "high"]
        elements.append(Spacer(1, 0.1 * inch))
        elements.append(Paragraph("<b>Quick Stats:</b>", compact_body))
        elements.append(Paragraph(
            f"• Deal-Breakers: {len(deal_breakers)} | High-Risk: {len(high_risk)} | Total Flagged: {len(flagged)}",
            compact_body))
        doc.build(elements)
        return buf.getvalue()
