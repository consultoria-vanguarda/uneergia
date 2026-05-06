const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentTitle, documentData, signatureUrl } = await req.json();

    // Cria o PDF
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text(documentTitle || 'Contrato UNE ENERGIA', 20, 20);
    
    // Linha divisória
    doc.setDrawColor(0, 100, 0);
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    // Dados do documento
    doc.setFontSize(11);
    let y = 35;
    
    if (documentData) {
      Object.entries(documentData).forEach(([key, value]) => {
        if (value && typeof value !== 'object') {
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          doc.text(`${label}: ${value}`, 20, y);
          y += 7;
          
          // Nova página se necessário
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
        }
      });
    }
    
    // Área de assinatura
    y += 20;
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFontSize(10);
    doc.text('Assinatura Digital:', 20, y);
    y += 5;
    
    // Busca a imagem da assinatura
    if (signatureUrl) {
      try {
        const signatureResponse = await fetch(signatureUrl);
        const signatureBlob = await signatureResponse.arrayBuffer();
        const base64Signature = btoa(
          new Uint8Array(signatureBlob).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        
        doc.addImage(`data:image/png;base64,${base64Signature}`, 'PNG', 20, y, 60, 25);
        y += 30;
      } catch (error) {
        console.error('Erro ao carregar assinatura:', error);
      }
    }
    
    // Data da assinatura
    doc.setFontSize(9);
    const dataAssinatura = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Assinado digitalmente em: ${dataAssinatura}`, 20, y);
    doc.text(`Por: ${user.full_name} (${user.email})`, 20, y + 5);
    
    // Marca d'água de autenticidade
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Documento com assinatura digital - UNE ENERGIA', 20, 285);
    
    // Converte para base64 data URL e cria um File
    const pdfBase64 = doc.output('datauristring'); // data:application/pdf;base64,...
    const base64Data = pdfBase64.split(',')[1];
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const pdfFile = new File([bytes], 'contrato_assinado.pdf', { type: 'application/pdf' });

    // Faz upload do PDF
    const uploadResponse = await db.integrations.Core.UploadFile({ file: pdfFile });
    
    return Response.json({
      success: true,
      pdf_url: uploadResponse.file_url
    });
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});