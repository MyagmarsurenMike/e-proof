# E-Proof System - Data Flow Diagram (DFD) Explanation

This document provides a detailed explanation of the Data Flow Diagrams (DFD) for the E-Proof system, ranging from the high-level context (Level 0) to detailed process breakdowns (Level 2).

---

## Level 0 DFD: Context Diagram

**Purpose:**  
The Level 0 DFD represents the entire E-Proof system as a single "Black Box" process. It illustrates the interaction between the system and external entities without showing internal details.

**Entities:**
1.  **User:** The person who uploads documents to be verified or checks the status of existing documents.
2.  **Blockchain Network:** The external decentralized ledger (e.g., Ethereum/Polygon) where document hashes are stored for immutability.

**Process:**
*   **0.0 E-Proof System:** The core application handling all logic.

**Data Flows:**
*   **User -> System:**
    *   *User Credentials* (for login).
    *   *Document File* (for upload/verification).
*   **System -> User:**
    *   *Verification Status* (Verified/Pending/Failed).
    *   *Transaction Receipt* (Proof of blockchain record).
*   **System -> Blockchain:**
    *   *Document Hash* (The digital fingerprint).
*   **Blockchain -> System:**
    *   *Transaction Hash/Confirmation* (Proof that the data was written).

---

## Level 1 DFD: System Overview

**Purpose:**  
Level 1 breaks down the single process from Level 0 into major sub-processes. It shows how data moves between the main functional modules of the application.

**Processes:**
1.  **1.0 Authentication Process:** Handles user registration, login, and session management (NextAuth.js).
2.  **2.0 Document Processing:** Handles file uploads, storage, and retrieval.
3.  **3.0 Verification Engine:** Handles cryptographic hashing and interaction with the Blockchain.

**Data Stores:**
*   **D1 User Database:** Stores user profiles and credentials (PostgreSQL).
*   **D2 Document Database:** Stores metadata, file paths, and verification statuses (PostgreSQL).
*   **D3 File Storage:** The physical file system (`/uploads` folder) where actual files reside.

**Flow Description:**
1.  **User** sends credentials to **1.0 Authentication**.
    *   **1.0** checks **D1 User Database** and grants access.
2.  **User** uploads a file to **2.0 Document Processing**.
    *   **2.0** saves the physical file to **D3 File Storage**.
    *   **2.0** saves file metadata (name, size) to **D2 Document Database**.
3.  **2.0** passes the file content to **3.0 Verification Engine**.
    *   **3.0** generates a Hash.
    *   **3.0** sends the Hash to the **Blockchain Network**.
    *   **3.0** updates **D2 Document Database** with the Blockchain Transaction ID.

---

## Level 2 DFD: Detailed Verification Process

**Purpose:**  
Level 2 dives deep into the specific "Verification Engine" (Process 3.0 from Level 1) to explain exactly how a document is secured.

**Sub-Processes:**
*   **3.1 Generate Hash:** Reads the file content and creates a SHA-256 cryptographic signature.
*   **3.2 Check Existence:** Queries the database to see if this hash already exists (preventing duplicates).
*   **3.3 Blockchain Transaction:** Prepares and signs a transaction containing the hash.
*   **3.4 Update Status:** Finalizes the record in the database.

**Detailed Flow:**
1.  **Input:** File Content arrives from the Document Processing module.
2.  **3.1 Generate Hash:** The system calculates the unique hash (e.g., `0xabc123...`).
3.  **3.2 Check Existence:**
    *   Query **D2 Document Database**.
    *   *If exists:* Return "Already Verified" to User.
    *   *If new:* Proceed to 3.3.
4.  **3.3 Blockchain Transaction:**
    *   The system uses its wallet to send the Hash to the **Blockchain Network**.
    *   **Blockchain** returns a `Transaction Hash`.
5.  **3.4 Update Status:**
    *   The system saves the `Transaction Hash` and sets status to `VERIFIED` in **D2 Document Database**.
6.  **Output:** The final Verification Result is sent back to the User.

---

## Summary of Data Privacy

A key aspect of this DFD design is **Privacy**:
*   **Files** stay in **D3 File Storage** (Local Server).
*   **Only Hashes** leave the system to go to the **Blockchain**.
*   **Git** is completely bypassed for file storage (via `.gitignore`), ensuring no sensitive data leaks to version control.
