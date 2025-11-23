# E-Proof Platform User Manual
## Blockchain Document Verification System

### Table of Contents
1. [Platform Overview](#platform-overview)
2. [Getting Started](#getting-started)
3. [Document Upload & Verification Process](#document-upload--verification-process)
4. [How to Check if a Document is Verified](#how-to-check-if-a-document-is-verified)
5. [Understanding Verification Results](#understanding-verification-results)
6. [Security Features](#security-features)
7. [Supported Document Types](#supported-document-types)
8. [Troubleshooting](#troubleshooting)

---

## Platform Overview

**E-Proof** is a blockchain-based document verification platform that provides immutable, tamper-proof verification for important documents including contracts, certificates, diplomas, and legal agreements. The platform uses cryptographic hashing and blockchain technology to ensure document authenticity without storing your actual documents.

### Key Benefits:
- **Blockchain Security**: Immutable blockchain technology protects your documents
- **Privacy Protected**: Only document fingerprints are stored, never the actual documents
- **Global Access**: Access your verified documents from anywhere in the world
- **Instant Verification**: Real-time verification status and blockchain certificates

---

## Getting Started

### 1. Account Setup
1. Visit the E-Proof homepage
2. Click "Бүртгэл үүсгэх" (Create Account) in the top navigation
3. Fill in your registration details
4. Verify your email address
5. Sign in to access the platform features

### 2. Navigation Overview
- **Home Page**: Platform overview, features, and testimonials
- **Verify Page**: Upload and verify documents
- **Dashboard**: Manage your verified documents
- **Sign In/Up**: Account access and registration

---

## Document Upload & Verification Process

### Step 1: Access the Verification Page
1. From the homepage, click "Баримт бичгээ баталгаажуулах" (Verify Your Document)
2. Or navigate to `/verify` directly
3. Sign in if prompted

### Step 2: Document Type Selection
Choose from the following document types:
- **Хуулийн гэрээ** (Legal Contract)
- **Гэрчилгээ/Диплом** (Certificate/Diploma)
- **Гэрээ/Санамж бичиг** (Agreement/Memorandum)
- **Диплом** (Diploma)
- **Лиценз** (License)
- **Бусад баримт бичиг** (Other Documents)

### Step 3: Document Information
1. **Document Title**: Enter a descriptive title for your document
2. **Additional Information** (Optional): Add any relevant details about the document

### Step 4: File Upload
1. **Supported Formats**: PDF, Word documents (.doc, .docx), text files (.txt), images (.jpg, .png)
2. **File Size Limit**: Maximum 10MB per file
3. **Upload Methods**:
   - Drag and drop files into the upload area
   - Click to browse and select files from your device

### Step 5: Submit for Verification
1. Review all information entered
2. Click "Блокчэйнд баталгаажуулах" (Verify on Blockchain)
3. The system will process your document through these stages:
   - File upload and processing
   - Cryptographic hash generation
   - Database storage
   - Blockchain verification initiation

---

## How to Check if a Document is Verified

### Method 1: Real-Time Status Tracking
After uploading a document, you'll see a real-time progress tracker showing:
1. **Document Uploaded** ✓
2. **Generating Document Hash** (In Progress/Completed)
3. **Sending to Blockchain** (In Progress/Completed)
4. **Transaction Confirmed** (In Progress/Completed)

### Method 2: Verification Result Page
Once processing is complete, you'll see:
- **Status Badge**: Shows current verification status
  - 🟢 **VERIFIED**: Successfully verified and stored on blockchain
  - 🟡 **PROCESSING**: Currently being processed
  - 🔴 **FAILED**: Verification failed, retry needed
- **Timeline**: Step-by-step progress of the verification process

### Method 3: Dashboard Access
1. Navigate to your dashboard (`/dashboard`)
2. View all your submitted documents
3. Check individual document statuses
4. Access verification certificates

### Method 4: Shareable Links
- Each verified document receives a unique shareable link
- Anyone with the link can verify the document's authenticity
- Links provide public verification without revealing document contents

---

## Understanding Verification Results

### Successful Verification Display
When a document is successfully verified, you'll see:

#### Document Information
- **Title**: Your document's title
- **Type**: Document category
- **Upload Time**: When the document was submitted
- **Status**: Current verification status
- **Description**: Any additional information provided

#### Blockchain Details
- **Document Hash**: Unique cryptographic fingerprint of your document
  - Example: `0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t`
- **Transaction ID**: Blockchain transaction identifier
  - Example: `0xabcdef1234567890abcdef1234567890abcdef12`
- **Block Number**: Specific blockchain block containing your verification
  - Example: `15,432,891`

#### Available Actions
- **Copy Hash**: Copy blockchain hash to clipboard
- **Download Certificate**: Download verification certificate
- **View on Block Explorer**: View transaction on public blockchain
- **Share Verification**: Generate shareable verification link

---

## Security Features

### Privacy Protection
- ✅ **No Document Storage**: Your actual documents are NEVER stored on servers or blockchain
- ✅ **Hash Only**: Only cryptographic fingerprints (hashes) are recorded
- ✅ **Local Processing**: All file processing happens locally in your browser
- ✅ **Encrypted Transmission**: All data transfers use enterprise-grade encryption

### Blockchain Security
- ✅ **Immutable Records**: Once recorded, verification cannot be altered
- ✅ **Tamper-Proof**: Any document changes will result in different hash
- ✅ **Permanent Storage**: Blockchain records last forever
- ✅ **Decentralized**: No single point of failure

### Anti-Fraud Protection
- ✅ **Unique Fingerprints**: Each document generates unique hash
- ✅ **Timestamp Verification**: Exact time of verification recorded
- ✅ **Public Verification**: Anyone can verify authenticity using hash
- ✅ **Forgery Detection**: Modified documents will fail verification

---

## Supported Document Types

### File Formats
| Format | Extension | Max Size | Notes |
|--------|-----------|----------|--------|
| PDF | .pdf | 10MB | Preferred format for contracts and certificates |
| Microsoft Word | .doc, .docx | 10MB | Legacy and modern Word documents |
| Text Files | .txt | 10MB | Plain text documents |
| Images | .jpg, .png | 10MB | Scanned documents and certificates |

### Document Categories
1. **Legal Contracts** - Business agreements, employment contracts
2. **Certificates** - Professional certifications, awards
3. **Diplomas** - Educational credentials, degrees
4. **Licenses** - Professional licenses, permits
5. **Agreements** - MOUs, partnership agreements
6. **Other** - Any other important documents

---

## Troubleshooting

### Common Issues and Solutions

#### Upload Problems
**Problem**: File won't upload
- ✅ Check file size (must be under 10MB)
- ✅ Verify file format is supported
- ✅ Ensure stable internet connection
- ✅ Try refreshing the page and uploading again

**Problem**: "File format not supported" error
- ✅ Convert document to supported format (PDF recommended)
- ✅ Check file extension matches actual file type

#### Verification Issues
**Problem**: Verification stuck in "Processing" status
- ✅ Wait 3-5 minutes for blockchain confirmation
- ✅ Check internet connection
- ✅ Refresh the page to update status

**Problem**: Verification failed
- ✅ Try uploading the document again
- ✅ Ensure document file is not corrupted
- ✅ Contact support if issue persists

#### Access Issues
**Problem**: Cannot access dashboard
- ✅ Ensure you're signed in to your account
- ✅ Check that you have documents uploaded
- ✅ Clear browser cache and cookies

### Getting Help
- **Platform Statistics**: Check homepage for system status
- **Contact Support**: Use platform contact information
- **Documentation**: Refer to this manual for guidance

---

## Best Practices

### Document Preparation
1. **File Quality**: Use high-quality scans for image files
2. **File Naming**: Use descriptive filenames
3. **File Size**: Compress large files while maintaining readability
4. **Format Choice**: PDF is recommended for maximum compatibility

### Security Recommendations
1. **Backup**: Keep original documents in secure storage
2. **Verification Links**: Store shareable links securely
3. **Regular Checks**: Periodically verify your documents remain accessible
4. **Professional Use**: Use for important business and legal documents

### Sharing Verified Documents
1. **Professional Sharing**: Share verification links instead of original documents
2. **Public Verification**: Recipients can verify authenticity without your involvement
3. **Permanent Records**: Blockchain verification lasts indefinitely
4. **Trust Building**: Verified documents build trust with clients and partners

---

## Platform Statistics & Trust Indicators
- **15,420+** Verified Documents
- **8,350+** Blockchain Records
- **250+** Trusted Organizations
- **Real-time** Verification Processing
- **Global** Access and Recognition

---

*This manual covers the complete functionality of the E-Proof platform. For additional support or questions, contact our support team or refer to the platform's help section.*