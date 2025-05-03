import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DocumentService } from '../../services/document.service';
import Swal from 'sweetalert2'; // Alerts

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
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
  selectedFile: File | null = null;
  s3FileUrl: string = '';
  canSubmit: boolean = false;

  chatInput: string = '';
  chatMessages: ChatMessage[] = [];
  documents: Document[] = [];
  showChatbot: boolean = false;
  selectedDocumentTitle: string | null = null;
  selectedDocumentVectorId: string | null = null;
  selectedMode: 'single' | 'multi' | 'global' = 'single'; // 🚀 New Mode Handling
  selectedVectorIds: string[] = []; // 🚀 For multi-file mode

  multiFileSelectionMode: boolean = false;
  selectedFilesForMultiChat: Document[] = [];
  showFileSelectorModal: boolean = false;

  searchTerm: string = ''; // For main dashboard search
  modalSearchTerm: string = ''; // For file selector modal search

  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  selectedDocumentId: string = '';

  alerts: any[] = [];
  showAlertsPopup: boolean = false;

  multiSessionId: string = '';

  predefinedQuestions: string[] = [
    'Summarize the content',
    'What are the key points?',
    'Give me an overview',
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

  get filteredDocuments() {
    return this.documents.filter((doc) =>
      doc.title.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get filteredModalDocuments() {
    return this.documents.filter((doc) =>
      doc.title.toLowerCase().includes(this.modalSearchTerm.toLowerCase())
    );
  }

  selectAllFiles() {
    this.selectedFilesForMultiChat = [...this.filteredModalDocuments];
  }

  clearAllFiles() {
    this.selectedFilesForMultiChat = [];
  }


  // onFileSelected(event: any) {
  //   this.selectedFile = event.target.files[0];
  //   if (this.selectedFile) {
  //     this.isLoading = true;
  //     this.documentService.ingestDocument(this.selectedFile).subscribe({
  //       next: (res) => {
  //         this.isLoading = false;
  //         this.selectedFile = null;
  //         this.fetchDocuments();

  //         // Resetting the file input
  //         this.resetFileInput();

  //         // Display success toast notification
  //         Swal.fire({
  //           position: 'top-end',
  //           icon: 'success',
  //           title: res.message || 'Document uploaded successfully!',
  //           toast: true,
  //           showConfirmButton: false,
  //           timer: 3000,
  //           timerProgressBar: true,
  //         });

  //       },
  //       error: (err) => {
  //         this.isLoading = false;

  //         // Resetting the file input
  //         this.resetFileInput();

  //         // Display error toast notification
  //         Swal.fire({
  //           position: 'top-end',
  //           icon: 'error',
  //           title: err.error?.error || 'Failed to upload document',
  //           toast: true,
  //           showConfirmButton: false,
  //           timer: 3000,
  //           timerProgressBar: true,
  //         });
  //       },
  //     });
  //   }
  // }

  uploadDocument() {
    if (!this.canSubmit) return;
  
    this.isLoading = true;
    this.documentService.ingestDocument(this.selectedFile, this.s3FileUrl).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.selectedFile = null;
        this.s3FileUrl = '';
        this.canSubmit = false;
        this.resetFileInput();
        this.fetchDocuments();
  
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: res.message || 'Document uploaded successfully!',
          toast: true,
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.resetFileInput();
  
        Swal.fire({
          position: 'top-end',
          icon: 'error',
          title: err.error?.error || 'Failed to upload document',
          toast: true,
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      },
    });
  }
  
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] || null;
    this.s3FileUrl = ''; // Clear S3 URL if uploading a file
    this.canSubmit = !!this.selectedFile;

    if (this.selectedFile) {
      this.uploadDocument(); // Immediately trigger upload
    }
  }
  
  resetFileInput() {
    this.fileInput.nativeElement.value = '';
  }

  onS3UrlChange() {
    this.canSubmit = !!this.selectedFile || !!this.s3FileUrl.trim();
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
        popup: 'animated-popup',
        title: 'swal-title',
        confirmButton: 'swal-confirm-button',
        cancelButton: 'swal-cancel-button',
      },
      // backdrop: `
      //   rgba(0,0,123,0.4)
      //   url("https://i.gifer.com/ZZ5H.gif")
      //   left top
      //   no-repeat
      // `,
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
    const timestamp = new Date().toLocaleTimeString();
    this.chatMessages.push({ type, content, timestamp });
    setTimeout(() => {
      const chatWindow = document.querySelector('.chat-window');
      if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
    }, 0);

  // 🔄 Auto-save for user/system/success messages (skip 'error')
  if (type === 'user' || type === 'system' || type === 'success') {
    this.autoSaveChat();
  }
  }

  autoSaveChat() {
    if (this.chatMessages.length === 0) return;
  
    if (this.selectedMode === 'single' && this.selectedDocumentId) {
      this.documentService
        .saveChatHistory(this.selectedDocumentId, this.chatMessages)
        .subscribe();
  
    } else if (this.selectedMode === 'multi' && this.multiSessionId) {
      this.documentService
        .saveMultiChatHistory(this.selectedVectorIds, this.chatMessages)
        .subscribe();
    }
  }

  
  openChatbot(document: any) {
    this.showChatbot = true;
    this.selectedDocumentTitle = document.title;
    this.selectedDocumentId = document.vector_id;
    this.selectedMode = 'single'; // Single file chat
    this.chatMessages = [];

    const welcomeMessage = `👋 Welcome! You are chatting about: "${this.selectedDocumentTitle}".`;

    this.documentService.getDocumentAlerts(this.selectedDocumentId).subscribe({
      next: (res) => {
        this.alerts = res.alerts || [];
      },
      error: () => {
        this.alerts = [];
      },
    });
    

    this.documentService.getChatHistory(this.selectedDocumentId).subscribe({
      next: (response) => {
        if (response.history && response.history.length > 0) {
          this.chatMessages = [
            ...this.chatMessages,
            ...(response.history || []),
          ];
        } else {
          this.addChatMessage('system', welcomeMessage);
        }
      },
      error: () => {
        this.chatMessages = [];
        this.addChatMessage('system', welcomeMessage);
      },
    });
  }

  startGlobalChat() {
    this.showChatbot = true;
    this.selectedMode = 'global';
    this.selectedDocumentTitle = '🌍 Global Chat';
    this.selectedDocumentId = '';
    this.chatMessages = [];
    this.addChatMessage(
      'system',
      '👋 Welcome to Global Chat across all documents.'
    );
  }

  startMultiFileChat() {
    if (this.documents.length > 0) {
      this.showFileSelectorModal = true; // ➔ Open modal to select files
    } else {
      this.errorMessage = 'No documents available for multi-file chat.';
    }
  }

  toggleFileSelection(doc: Document) {
    const index = this.selectedFilesForMultiChat.findIndex(
      (d) => d.vector_id === doc.vector_id
    );
    if (index > -1) {
      this.selectedFilesForMultiChat.splice(index, 1);
    } else {
      this.selectedFilesForMultiChat.push(doc);
    }
  }

  confirmMultiFileChat() {
    if (this.selectedFilesForMultiChat.length === 0) {
      alert('Please select at least one document.');
      return;
    }
    this.showFileSelectorModal = false;
    this.showChatbot = true;
    this.selectedMode = 'multi';
    this.selectedDocumentTitle = '📂 Multi-File Chat';
    this.selectedVectorIds = this.selectedFilesForMultiChat.map(
      (doc) => doc.vector_id
    );
    this.chatMessages = [];

    this.documentService
      .saveMultiChatHistory(this.selectedVectorIds, [])
      .subscribe({
        next: (res) => {
          this.multiSessionId = res.session_id;

          const resumeMessage =
            res.is_new === false
              ? '👋 Resuming previous multi-file chat session.'
              : `👋 Multi-File Chat started with ${this.selectedVectorIds.length} documents.`;

          this.documentService
            .getMultiChatHistory(this.multiSessionId)
            .subscribe({
              next: (response) => {
                this.chatMessages = [...(response.history || [])];

                const alreadyHasResumeMsg = this.chatMessages.some(
                  (msg) =>
                    msg.type === 'system' &&
                    msg.content.includes(
                      'Resuming previous multi-file chat session'
                    )
                );

                if (!alreadyHasResumeMsg) {
                  this.chatMessages.unshift({
                    type: 'system',
                    content: resumeMessage,
                    timestamp: new Date().toLocaleTimeString(),
                  });
                }
              },
              error: () => {
                this.addChatMessage('system', resumeMessage);
              },
            });
        },
        error: () => {
          this.addChatMessage(
            'system',
            '👋 Multi-File Chat could not be started.'
          );
        },
      });
  }

  cancelMultiFileChat() {
    this.showFileSelectorModal = false;
    this.selectedFilesForMultiChat = [];
  }

  handleChatInput() {
    if (!this.chatInput.trim()) return;

    const input = this.chatInput.trim();
    const timestamp = new Date().toLocaleTimeString();

    const userMessage: ChatMessage = {
      type: 'user',
      content: input,
      timestamp,
    };
    
    this.chatMessages.push(userMessage);
    this.chatInput = '';

    let apiCall;

    // Memory window: Pick last 5 messages (alternating user-system)
    const memoryWindow = 5;
    const chatHistory = this.chatMessages
      .slice(-memoryWindow * 2) // each turn = user + system
      .filter((m) => m.type === 'user' || m.type === 'system')
      .map((m) => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

    // Prepare body depending on mode
    const body: any = {
      question: input,
      chat_history: chatHistory,
    };

    if (this.selectedMode === 'single') {
      body.vector_id = this.selectedDocumentId;
      apiCall = this.documentService.askQuestion(body);
    } else if (this.selectedMode === 'multi') {
      body.vector_ids = this.selectedVectorIds;
      apiCall = this.documentService.askMultiFileQuestion(body);
    } else if (this.selectedMode === 'global') {
      apiCall = this.documentService.askGlobalQuestion(body);
    }

    if (apiCall) {
      this.isLoading = true;
      apiCall.subscribe({
        next: (res) => {
          this.isLoading = false;
          const systemMessage: ChatMessage = {
            type: 'system',
            content: res.answer,
            timestamp: new Date().toLocaleTimeString(),
          };
          this.chatMessages.push(systemMessage);
          this.autoSaveChat();  // 💾 Auto-save after assistant reply
        },
        error: (err) => {
          this.isLoading = false;
          const errorMessage: ChatMessage = {
            type: 'error',
            content: err.error?.error || 'Failed to get answer',
            timestamp: new Date().toLocaleTimeString(),
          };
          this.chatMessages.push(errorMessage);
        },
      });
    }
  }


  closeChatbot() {
    this.showChatbot = false;

    if (this.chatMessages.length === 0) return;

    if (this.selectedMode === 'single' && this.selectedDocumentId) {
      this.documentService
        .saveChatHistory(this.selectedDocumentId, this.chatMessages)
        .subscribe();
    } else if (this.selectedMode === 'multi' && this.multiSessionId) {
      this.documentService
        .saveMultiChatHistory(this.selectedVectorIds, this.chatMessages)
        .subscribe();
    }
  }

  clearChat() {
    this.chatMessages = [];
    if (this.selectedMode === 'single' && this.selectedDocumentId) {
      this.documentService
        .clearChatHistory(this.selectedDocumentId)
        .subscribe();
    } else if (this.selectedMode === 'multi' && this.multiSessionId) {
      this.documentService
        .clearMultiChatHistory(this.multiSessionId)
        .subscribe();
    }
  }

  setPredefinedQuestion(question: string) {
    this.chatInput = question;
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
