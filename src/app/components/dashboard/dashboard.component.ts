import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DocumentService } from '../../services/document.service';
import Swal from 'sweetalert2'; // Add at the top

interface ChatMessage {
  type: 'user' | 'system' | 'error' | 'success';
  content: string;
  timestamp?: string;
}

interface Document {
  id: number;
  title: string;
  vector_id: string;
  uploaded_at: string;
  extension: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  selectedFile: File | null = null;
  chatInput: string = '';
  chatMessages: ChatMessage[] = [];
  documents: Document[] = [];
  showChatbot: boolean = false;
  selectedDocumentTitle: string | null = null;
  selectedDocumentVectorId: string | null = null;

  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  selectedDocumentId: string = '';

  // Define predefined questions
  predefinedQuestions: string[] = [
    'Summarize the content',
    'What are the key points?',
    'Give me an overview'
    // 'Generate a Email Template based on the content', 
  ];

  constructor(
    private authService: AuthService,
    private documentService: DocumentService
  ) {}

  ngOnInit() {
    this.fetchDocuments();
  }

  fetchDocuments() {
    this.isLoading = true;
    this.documentService.listDocuments().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.documents && res.documents.length > 0) {
          this.documents = res.documents.map((doc: any) => ({
            id: doc.id,
            title: doc.title,
            vector_id: doc.vector_id,
            uploaded_at: new Date(doc.uploaded_at).toLocaleString(),
            extension: doc.title.split('.').pop()?.toLowerCase() || 'unknown',
          }));
        } else {
          this.addChatMessage(
            'system',
            'No documents found. Please upload a document.'
          );
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.addChatMessage(
          'error',
          'Failed to load documents: ' + err.message
        );
      },
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      this.isLoading = true;
      this.successMessage = '';
      this.errorMessage = '';
      this.documentService.ingestDocument(this.selectedFile).subscribe({
        next: (res) => {
          // alert(res.message); // For example, displaying an alert with the message

          // this.selectedFile = null;
          // this.ngOnInit(); // Refresh document list
          this.isLoading = false;
          this.successMessage =
            res.message || 'Document uploaded successfully!';
          this.selectedFile = null;
          this.fetchDocuments(); // Refresh document list
          setTimeout(() => (this.successMessage = ''), 3000);
        },

        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.error || 'Failed to upload document';
          setTimeout(() => (this.errorMessage = ''), 3000);
        },
      });
    }
  }

  deleteDocument(document: Document) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete the document: ${document.title}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'animated-popup', // 👈 apply custom animation
        title: 'swal-title',
        confirmButton: 'swal-confirm-button',
        cancelButton: 'swal-cancel-button',
      },
      backdrop: `
        rgba(0,0,123,0.4)
        url("https://i.gifer.com/ZZ5H.gif")  // Optional background GIF
        left top
        no-repeat
      `,
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.successMessage = '';
        this.errorMessage = '';
        this.documentService.deleteDocument(document.vector_id).subscribe({
          next: () => {
            this.isLoading = false;
            this.successMessage = 'Document deleted successfully';
            this.fetchDocuments();
            Swal.fire('Deleted!', 'The document has been deleted.', 'success');
            setTimeout(() => (this.successMessage = ''), 3000);
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err.error?.error || 'Failed to delete document';
            Swal.fire('Error!', this.errorMessage, 'error');
          },
        });
      }
    });
  }

  addChatMessage(
    type: 'user' | 'system' | 'error' | 'success',
    content: string
  ) {
    const timestamp = new Date().toLocaleTimeString(); // for full YYYY-MM-DDTHH:mm:ssZ format
    this.chatMessages.push({ type, content, timestamp });
    // Auto-scroll to bottom
    setTimeout(() => {
      const chatWindow = document.querySelector('.chat-window');
      if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
    }, 0);
  }

  openChatbot(document: any) {
    this.showChatbot = true;
    this.selectedDocumentTitle = document.title;
    this.selectedDocumentId = document.vector_id;

    // Clear any previous chat when opening
    this.chatMessages = [];

    // Prepare default messages
    const welcomeMessage = `👋 Welcome! You are chatting about: "${this.selectedDocumentTitle}".`;
    // Add default messages to chat
    

    // Fetch old chat history
    this.documentService.getChatHistory(this.selectedDocumentId).subscribe({
      next: (response) => {
        if (response.history && response.history.length > 0) {
        // this.chatMessages = response.history || [];
        this.chatMessages = [...this.chatMessages, ...(response.history || [])];
        }
        else{
          this.addChatMessage('system', welcomeMessage);
        }
      },
      error: () => {
        this.chatMessages = [];
      },
    });
  }

  setPredefinedQuestion(question: string) {
    this.chatInput = question;  // Set the input field to the selected question
  }


  closeChatbot() {
    this.showChatbot = false;

    // Save chat history when closing
    if (this.selectedDocumentId && this.chatMessages.length > 0) {
      this.documentService
        .saveChatHistory(this.selectedDocumentId, this.chatMessages)
        .subscribe();
    }
  }

  handleChatInput() {
    if (!this.chatInput.trim()) return;

    const input = this.chatInput.trim();
    const loadingMessageId = this.chatMessages.length;
    this.addChatMessage('user', input);
    this.chatInput = '';
    //   // Treat as a normal question
    const questionData: any = {
      question: input,
      vector_id: this.selectedDocumentId, // Always use selectedDocumentId
    };

    // Attach the selected document vector ID dynamically
    if (this.selectedDocumentVectorId) {
      questionData.vector_id = this.selectedDocumentVectorId;
    }

    this.documentService.askQuestion(questionData).subscribe({
      next: (res) => this.addChatMessage('system', res.answer),
      error: (err) =>
        this.addChatMessage(
          'error',
          err.error?.error || 'Failed to get answer'
        ),
    });
  }

  clearChat() {
    this.chatMessages = [];
    if (this.selectedDocumentId) {
      this.documentService
        .clearChatHistory(this.selectedDocumentId)
        .subscribe();
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleChatInput();
    }
  }

  getFileIconClass(extension: string): string {
    const ext = extension.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'file-icon pdf-icon';
      case 'doc':
      case 'docx':
        return 'file-icon word-icon';
      case 'xls':
      case 'xlsx':
        return 'file-icon excel-icon';
      case 'ppt':
      case 'pptx':
        return 'file-icon ppt-icon';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'file-icon image-icon';
      case 'txt':
        return 'file-icon txt-icon';
      case 'csv':
        return 'file-icon csv-icon';
      case 'zip':
      case 'rar':
        return 'file-icon zip-icon';
      default:
        return 'file-icon default-icon';
    }
  }
}
