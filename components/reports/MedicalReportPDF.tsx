'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Note: In production you might want to load fonts to support different characters
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#e0e0e0', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#00288E' },
  subtitle: { fontSize: 12, color: '#666', marginTop: 4 },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#00288E', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 100, fontSize: 10, color: '#666' },
  value: { flex: 1, fontSize: 10, color: '#000' },
  textBody: { fontSize: 10, lineHeight: 1.5, color: '#333' },
  stepItem: { flexDirection: 'row', marginBottom: 8 },
  stepNumber: { width: 20, fontSize: 10, fontWeight: 'bold', color: '#00288E' },
  stepText: { flex: 1, fontSize: 10, color: '#333' }
});

export const MedicalReportPDF = ({ patientDetails, aiResults, emergencyDescription }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Copilot AI Report</Text>
        <Text style={styles.subtitle}>Generated automatically for preliminary medical review</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient Demographics</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Full Name:</Text>
          <Text style={styles.value}>{patientDetails?.name || 'Unknown'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Age / Gender:</Text>
          <Text style={styles.value}>{patientDetails?.age || 'Unknown'} / {patientDetails?.gender || 'Unknown'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Blood Group:</Text>
          <Text style={styles.value}>{patientDetails?.bloodGroup || 'Unknown'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Conditions:</Text>
          <Text style={styles.value}>{patientDetails?.medicalConditions || 'None'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Medications:</Text>
          <Text style={styles.value}>{patientDetails?.medications || 'None'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Allergies:</Text>
          <Text style={styles.value}>{patientDetails?.allergies || 'None'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reported Emergency</Text>
        <Text style={styles.textBody}>{emergencyDescription || 'No description provided'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Clinical Summary (Urgency: {aiResults?.urgencyLevel})</Text>
        <Text style={styles.textBody}>{aiResults?.medicalSummary || aiResults?.simpleExplanation || 'No summary available'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>First-Aid Guidance Provided</Text>
        {aiResults?.nextSteps?.map((step: string, index: number) => (
          <View key={index} style={styles.stepItem}>
            <Text style={styles.stepNumber}>{index + 1}.</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
      
    </Page>
  </Document>
);

export default MedicalReportPDF;
