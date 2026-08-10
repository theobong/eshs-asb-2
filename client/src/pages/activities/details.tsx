import { useState, useEffect, useRef } from "react";
import { useLocation as useWouterLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemedPageWrapper, ThemedCard, PrimaryButton, OutlineButton } from "@/components/ThemedComponents";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";
import { BlurContainer, BlurCard, BlurActionButton } from "@/components/UniversalBlurComponents";
import { getEvents, createFormSubmission, type Event } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";

// Types for form data
interface FormData {
  studentId: File | null;
  customForms: { [key: string]: File | null };
  studentName: string;
  email: string;
  quantity: number;
  notes: string;
}

// Types for form upload status
interface FormUploadStatus {
  uploading: boolean;
  success: boolean;
  error: boolean;
  message: string;
}

interface CartItem {
  id: number | string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  size?: string;
  color?: string;
  type?: 'product' | 'event';
  eventId?: string;
}

export default function EventDetails() {
  const [, setLocation] = useWouterLocation();
  const [eventId, setEventId] = useState<string>("");
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketType, setSelectedTicketType] = useState<number | null>(null); // Index of selected ticket type
  const [formData, setFormData] = useState<FormData>({
    studentId: null,
    customForms: {},
    studentName: '',
    email: '',
    quantity: 1,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<FormUploadStatus>({
    uploading: false,
    success: false,
    error: false,
    message: ''
  });
  const { addToCart } = useCart();

  // File input refs
  const fileInputRefs = {
    studentId: useRef<HTMLInputElement>(null),
  };

  // Custom forms refs object
  const customFormRefs = useRef<{[key: string]: HTMLInputElement | null}>({});


  useEffect(() => {
    const loadEventData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Extract event ID from the URL
        const currentPath = window.location.pathname;
        const matches = currentPath.match(/\/activities\/details\/(.+)$/);
        
        if (matches) {
          const id = matches[1];
          setEventId(id);
          
          // Fetch all events and find the specific one
          const eventsData = await getEvents();
          const selectedEvent = eventsData.find(e => e._id === id);
            if (selectedEvent) {
            setEvent(selectedEvent);
          } else {
            setError('Event not found');
          }
        } else {
          setError('Invalid event URL');
        }
      } catch (err) {
        console.error('Failed to load event:', err);
        setError('Failed to load event data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, []);

  const handleBackClick = () => {
    setLocation("/activities");
  };
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getAvailabilityStatus = (maxTickets?: number) => {
    if (!maxTickets) return { status: "Available", color: "bg-green-500/20 text-green-200 border-green-500/30" };
    
    // For now, assume tickets are available since we don't track sold tickets yet
    const remaining = maxTickets; // This would be calculated from actual sales in a real system
    const percentage = (remaining / maxTickets) * 100;
    
    if (percentage > 50) return { status: "Available", color: "bg-green-500/20 text-green-200 border-green-500/30" };
    if (percentage > 20) return { status: "Limited", color: "bg-yellow-500/20 text-yellow-200 border-yellow-500/30" };
    if (percentage > 0) return { status: "Few Left", color: "bg-red-500/20 text-red-200 border-red-500/30" };
    return { status: "Sold Out", color: "bg-gray-500/20 text-gray-200 border-gray-500/30" };
  };

  // Helper function to get the selected ticket type's price, or 0 if no tickets
  const getEventPrice = () => {
    if (!event?.ticketTypes || event.ticketTypes.length === 0 || selectedTicketType === null) return 0;
    const selectedTicket = event.ticketTypes[selectedTicketType];
    return selectedTicket ? selectedTicket.price : 0;
  };

  // Helper function to get max tickets from the selected ticket type
  const getMaxTickets = () => {
    if (!event?.ticketTypes || event.ticketTypes.length === 0 || selectedTicketType === null) return undefined;
    const selectedTicket = event.ticketTypes[selectedTicketType];
    return selectedTicket ? selectedTicket.maxTickets : undefined;
  };

  // Helper function to get the selected ticket type details
  const getSelectedTicketType = () => {
    if (!event?.ticketTypes || event.ticketTypes.length === 0 || selectedTicketType === null) return null;
    return event.ticketTypes[selectedTicketType];
  };

  // Helper function to check if a ticket type is available (not sold out)
  const isTicketTypeAvailable = (maxTickets: number) => {
    // For now, assume all tickets are available since we don't track sold tickets yet
    // In a real system, this would check: soldTickets < maxTickets
    const soldTickets = 0; // This would come from the database
    return soldTickets < maxTickets;
  };

  // Get available ticket types (filter out sold out ones)
  const getAvailableTicketTypes = () => {
    if (!event?.ticketTypes) return [];
    return event.ticketTypes.filter(ticket => isTicketTypeAvailable(ticket.maxTickets));
  };
  const handleQuantityChange = (quantity: number) => {
    if (event) {
      // For now, allow up to 10 tickets or maxTickets if specified
      const maxTickets = getMaxTickets();
      const maxAllowed = maxTickets ? Math.min(10, maxTickets) : 10;
      setFormData(prev => ({
        ...prev,
        quantity: Math.max(1, Math.min(quantity, maxAllowed))
      }));
    }
  };

  const handleFileUpload = (field: keyof FormData, file: File | null) => {
    if (field === 'customForms') {
      // This won't be called directly for customForms
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleCustomFileUpload = (formName: string, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      customForms: {
        ...prev.customForms,
        [formName]: file
      }
    }));
  };

  // Helper to validate email format
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmitApproval = async () => {
    if (!event) return;

    // Check if ticket type is selected (required for events with ticket types)
    if (event.ticketTypes && event.ticketTypes.length > 0 && selectedTicketType === null) {
      setUploadStatus({
        uploading: false,
        success: false,
        error: true,
        message: 'Please select a ticket type before submitting'
      });
      return;
    }

    // Form validation
    if (!formData.studentName.trim()) {
      setUploadStatus({
        uploading: false,
        success: false,
        error: true,
        message: 'Please enter your name'
      });
      return;
    }

    if (!formData.email.trim() || !isValidEmail(formData.email)) {
      setUploadStatus({
        uploading: false,
        success: false,
        error: true,
        message: 'Please enter a valid email address'
      });
      return;
    }

    // Check required forms based on event settings
    if (event.requiredForms) {
      if (event.requiredForms.studentIdRequired && !formData.studentId) {
        setUploadStatus({
          uploading: false,
          success: false,
          error: true,
          message: 'Student ID is required'
        });
        return;
      }
      
      // Check custom forms
      if (event.requiredForms.customForms && event.requiredForms.customForms.length > 0) {
        for (const customForm of event.requiredForms.customForms) {
          if (customForm.required !== false && !formData.customForms[customForm.name]) {
            setUploadStatus({
              uploading: false,
              success: false,
              error: true,
              message: `${customForm.name} form is required`
            });
            return;
          }
        }
      }
    }

    setIsSubmitting(true);
    setUploadStatus({
      uploading: true,
      success: false,
      error: false,
      message: 'Uploading forms and submitting your request...'
    });

    try {
      // Upload all files to the server first
      const uploadedForms = [];

      // Collect all files to upload
      const filesToUpload: File[] = [];
      const fileLabels: string[] = [];

      if (formData.studentId) {
        filesToUpload.push(formData.studentId);
        fileLabels.push('Student ID');
      }

      for (const [formName, file] of Object.entries(formData.customForms)) {
        if (file) {
          filesToUpload.push(file);
          fileLabels.push(formName);
        }
      }

      // Upload files to server
      if (filesToUpload.length > 0) {
        const uploadFormData = new FormData();
        filesToUpload.forEach(file => {
          uploadFormData.append('forms', file);
        });

        const uploadResponse = await fetch('/api/form-submissions/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload forms');
        }

        const uploadedFiles = await uploadResponse.json();

        // Map uploaded files to form labels
        uploadedFiles.forEach((uploadedFile: { fileName: string; fileUrl: string; fileType: string }, index: number) => {
          uploadedForms.push({
            fileName: fileLabels[index],
            fileUrl: uploadedFile.fileUrl,
            fileType: uploadedFile.fileType
          });
        });
      }

      // Create form submission record
      const selectedTicket = getSelectedTicketType();
      await createFormSubmission({
        eventId: event._id,
        studentName: formData.studentName,
        email: formData.email,
        forms: uploadedForms,
        quantity: 1, // Always 1 for approval requests
        totalAmount: selectedTicket ? selectedTicket.price * 1 : 0,
        notes: formData.notes,
        status: 'pending',
        ticketType: selectedTicket ? {
          name: selectedTicket.name,
          price: selectedTicket.price,
          description: selectedTicket.description
        } : undefined
      });

      // Show success message
      setUploadStatus({
        uploading: false,
        success: true,
        error: false,
        message: 'Your forms have been submitted successfully. You will receive an email when your request is approved.'
      });
      
      // Reset form data
      setFormData({
        studentId: null,
        customForms: {},
        studentName: '',
        email: '',
        quantity: 1,
        notes: ''
      });
      setSelectedTicketType(null);

      // User will click button to redirect
    } catch (error) {
      console.error('Form submission failed:', error);
      setUploadStatus({
        uploading: false,
        success: false,
        error: true,
        message: 'Failed to submit forms. Please try again.'
      });
      setIsSubmitting(false);
    }
  };

  const handleDirectPurchase = () => {
    if (!event) return;
    
    // Check if ticket type is selected (required for events with ticket types)
    if (event.ticketTypes && event.ticketTypes.length > 0 && selectedTicketType === null) {
      alert('Please select a ticket type before adding to cart');
      return;
    }
    
    // Add to cart using CartContext
    const selectedTicket = getSelectedTicketType();
    const cartItem = {
      id: event._id,
      name: selectedTicket ? `${event.title} - ${selectedTicket.name}` : event.title,
      price: getEventPrice(),
      quantity: formData.quantity,
      type: 'event' as const,
      eventId: event._id,
      ticketType: selectedTicket?.name,
      image: "/api/placeholder/300/300" // Default image for events
    };

    addToCart(cartItem);
    sessionStorage.setItem('cart-referrer', `/activities/details/${event._id}`);
    setLocation("/shop/cart");
  };

  if (!event) {
    return (
      <UniversalPageLayout pageType="information" title="Event Not Found" backButtonText="Back to Activities" onBackClick={handleBackClick}>
        {({ contentVisible }) => (
          <BlurContainer contentVisible={contentVisible} className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-4">Event Not Found</h1>
              <p className="text-gray-300 mb-6">The event you're looking for doesn't exist.</p>
              <BlurActionButton 
                contentVisible={contentVisible}
                onClick={handleBackClick}
              >
                Back to Activities
              </BlurActionButton>
            </div>
          </BlurContainer>
        )}
      </UniversalPageLayout>
    );
  }

  // No longer needed since we removed the availability card
  // const availability = getAvailabilityStatus(getMaxTickets());

  return (
    <UniversalPageLayout pageType="information" title="Event Details" backButtonText="Back" onBackClick={handleBackClick}>
      {({ contentVisible }) => (
        <div className="max-w-4xl mx-auto px-8">
          {/* Event Details */}
          <div 
            className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl mb-8 transform transition-all duration-500 ease-out"
            style={{
              opacity: contentVisible ? 1 : 0,
              transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
              transitionDelay: '200ms'
            }}
          >
            <div className="p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-3xl font-bold text-white">{event.title}</h2>
                    {event.requiresApproval && (
                      <Badge variant="outline" className="bg-orange-500/20 text-orange-200 border-orange-500/30">
                        Requires Approval
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="ml-4 text-lg px-3 py-1">
                  {event.category}
                </Badge>
              </div>

              {/* Event Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center text-lg">
                  <svg className="w-6 h-6 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-200">{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center text-lg">
                  <svg className="w-6 h-6 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-200">{event.time}</span>
                </div>
                <div className="flex items-center text-lg">
                  <svg className="w-6 h-6 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-200">{event.location}</span>
                </div>
              </div>

              {/* Description - Now prominently placed after location */}
              <div className="mb-6">
                <p className="text-gray-300 text-lg leading-relaxed">{event.description}</p>
              </div>
            </div>
          </div>

          {/* Ticket Selection */}
          {event.ticketTypes && event.ticketTypes.length > 0 && (
            <div 
              className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl mb-8 transform transition-all duration-500 ease-out"
              style={{
                opacity: contentVisible ? 1 : 0,
                transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
                transitionDelay: '300ms'
              }}
            >
              <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-3">
                  Select Ticket Type <span className="text-red-400">*</span>
                </h3>
                {getAvailableTicketTypes().length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {getAvailableTicketTypes().map((ticket, availableIndex) => {
                      const originalIndex = event.ticketTypes!.findIndex(t => t === ticket);
                      return (
                        <div 
                          key={originalIndex} 
                          className={`p-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            selectedTicketType === originalIndex 
                              ? 'border-blue-400 bg-blue-500/10 shadow-lg transform scale-105' 
                              : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                          }`}
                          onClick={() => setSelectedTicketType(originalIndex)}
                        >
                          <div className="text-center">
                            <div className="font-semibold text-white text-sm mb-1">{ticket.name}</div>
                            <div className="text-xl font-bold text-green-400 mb-1">${ticket.price.toFixed(2)}</div>
                            <div className="text-xs text-gray-300">{ticket.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-4xl mb-2">🎫</div>
                    <div className="text-xl font-bold text-red-400 mb-1">SOLD OUT</div>
                    <div className="text-gray-400 text-sm">All ticket types for this event are currently sold out.</div>
                  </div>
                )}
              </div>
            </div>
          )}          {/* Purchase/Registration Section */}
          <div 
            className="border-t border-white/10 pt-6 mt-6 transform transition-all duration-500 ease-out"
            style={{
              opacity: contentVisible ? 1 : 0,
              transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
              transitionDelay: '400ms'
            }}
          >
            {event.requiresApproval ? (
              // Direct approval form display (no card wrapper)
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Approval Request Form</h3>
                
                {/* Full Screen Thank You Overlay - Moved outside of main content */}

                {uploadStatus.error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
                    <p className="text-red-200">{uploadStatus.message}</p>
                  </div>
                )}

                {!uploadStatus.success && (
                  <div 
                    className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl p-6 transform transition-all duration-500 ease-out"
                    style={{
                      opacity: contentVisible ? 1 : 0,
                      transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
                      transitionDelay: '500ms'
                    }}
                  >
                    <form className="space-y-6">
                      {/* Student Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="studentName" className="text-white mb-2 block">Student Name</Label>
                          <Input
                            id="studentName"
                            value={formData.studentName}
                            onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                            placeholder="Enter your full name"
                            className="bg-white/5 border-white/20 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-white mb-2 block">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Enter your email address"
                            className="bg-white/5 border-white/20 text-white"
                            required
                          />
                        </div>
                      </div>


                      {/* Required Forms Section */}
                      <div className="space-y-4">
                        <h4 className="text-xl font-semibold text-white">Required Forms</h4>
                        
                        {/* Student ID */}
                        {event.requiredForms?.studentIdRequired && (
                          <div>
                            <Label htmlFor="studentId" className="text-white mb-2 block">
                              Student ID {formData.studentId ? '✓' : '*'}
                            </Label>
                            <Input
                              id="studentId"
                              type="file"
                              ref={fileInputRefs.studentId}
                              onChange={(e) => handleFileUpload('studentId', e.target.files?.[0] || null)}
                              className="bg-white/5 border-white/20 text-white"
                              accept=".jpg,.jpeg,.png,.pdf"
                              required
                            />
                            <p className="text-xs text-gray-400 mt-1">Upload a photo or scan of your student ID</p>
                          </div>
                        )}

                        {/* Custom Forms */}
                        {event.requiredForms?.customForms && event.requiredForms.customForms.length > 0 && (
                          <div className="space-y-3">
                            {event.requiredForms.customForms.map((customForm, index) => (
                              <div key={index}>
                                <Label htmlFor={`customForm_${index}`} className="text-white mb-2 block">
                                  {customForm.name} {formData.customForms[customForm.name] ? '✓' : (customForm.required !== false ? '*' : '')}
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    id={`customForm_${index}`}
                                    type="file"
                                    ref={(el) => { customFormRefs.current[customForm.name] = el; }}
                                    onChange={(e) => handleCustomFileUpload(customForm.name, e.target.files?.[0] || null)}
                                    className="bg-white/5 border-white/20 text-white"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    required={customForm.required !== false}
                                  />
                                  {customForm.pdfUrl && (
                                    <a 
                                      href={customForm.pdfUrl} 
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-300 hover:text-blue-200 text-sm whitespace-nowrap"
                                    >
                                      Download Template
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      <div>
                        <Label htmlFor="notes" className="text-white mb-2 block">Additional Notes (optional)</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Any additional information we should know..."
                          className="bg-white/5 border-white/20 text-white"
                          rows={3}
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="pt-2">
                        <PrimaryButton
                          onClick={handleSubmitApproval}
                          disabled={isSubmitting || uploadStatus.success || (event.ticketTypes && event.ticketTypes.length > 0 && selectedTicketType === null)}
                          className="w-full py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Submitting...
                            </>
                          ) : (event.ticketTypes && event.ticketTypes.length > 0 && selectedTicketType === null) ? 'Select Ticket Type First' : 'Submit for Approval'}
                        </PrimaryButton>

                        <p className="text-sm text-gray-400 mt-3">
                          * Once submitted, your request will be reviewed by an administrator. 
                          You will receive an email notification when your request is approved or denied.
                        </p>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              // Price/Quantity section for non-approval events
              <div 
                className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl p-6 transform transition-all duration-500 ease-out"
                style={{
                  opacity: contentVisible ? 1 : 0,
                  transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
                  transitionDelay: '500ms'
                }}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    {/* Price and Availability */}
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold text-white">${getEventPrice().toFixed(2)}</div>
                      {selectedTicketType !== null && (
                        <Badge variant="outline" className="bg-green-500/20 text-green-200 border-green-500/30 ml-2 px-2 py-1">
                          Available
                        </Badge>
                      )}
                    </div>

                    {/* Quantity Selection */}
                    <div className="flex items-center space-x-4">
                      <label className="text-white">Quantity:</label>
                      <div className="flex items-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 bg-white/5 border-white/20 text-white"
                          onClick={() => handleQuantityChange(formData.quantity - 1)}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </Button>
                        <Input
                          type="number"
                          value={formData.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              handleQuantityChange(value);
                            }
                          }}
                          className="w-16 text-center mx-2 bg-white/5 border-white/20 text-white"
                          min="1"
                          max={getMaxTickets() || 10}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 bg-white/5 border-white/20 text-white"
                          onClick={() => handleQuantityChange(formData.quantity + 1)}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </Button>
                      </div>
                    </div>

                    {/* Total Price */}
                    <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-4">
                      <div className="text-white text-lg font-medium">Total:</div>
                      <div className="text-white text-xl font-bold">${(getEventPrice() * formData.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="flex-1 flex items-end justify-center md:justify-end">
                    <PrimaryButton
                      onClick={handleDirectPurchase}
                      disabled={selectedTicketType === null}
                      className="w-full md:w-auto px-8 py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {selectedTicketType === null ? 'Select Ticket Type' : 'Add to Cart'}
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Success Modal - Fixed positioning and styling */}
          {uploadStatus.success && (
          <>
            {/* Backdrop with blur */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[9999] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <div className="relative transform overflow-hidden rounded-3xl bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl px-4 pb-4 pt-5 text-left transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-8">
                <div className="text-center">
                  {/* Success Icon */}
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-500/20 backdrop-blur-xl border border-green-500/30 mb-6 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                    <svg className="h-14 w-14 text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">
                    Success!
                  </h3>
                  
                  {/* Message */}
                  <div className="mb-8">
                    <p className="text-white text-lg mb-3">
                      Your form has been submitted for approval
                    </p>
                    <p className="text-white/60 text-sm leading-relaxed">
                      You'll receive an email notification once your request is reviewed. After approval, you'll be able to complete your ticket purchase.
                    </p>
                  </div>
                  
                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-2xl bg-gradient-to-r from-green-500/80 to-emerald-500/80 backdrop-blur-xl border border-white/10 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(34,197,94,0.3)] hover:shadow-[0_8px_40px_rgba(34,197,94,0.4)] hover:scale-[1.02] transition-all duration-200 sm:w-auto"
                      onClick={() => {
                        setUploadStatus({ uploading: false, success: false, error: false, message: '' });
                        window.location.href = '/activities';
                      }}
                    >
                      Back to Activities
                    </button>
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-white/10 hover:scale-[1.02] transition-all duration-200 sm:w-auto"
                      onClick={() => {
                        setUploadStatus({ uploading: false, success: false, error: false, message: '' });
                        window.location.href = '/';
                      }}
                    >
                      Go to Home
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Error Toast - Glassmorphism style */}
      {uploadStatus.error && !uploadStatus.uploading && (
        <div className="fixed bottom-4 right-4 z-[9999] max-w-md animate-in slide-in-from-right duration-300">
          <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-[0_8px_32px_rgba(239,68,68,0.3)] p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-white">
                  Submission Error
                </p>
                <p className="mt-1 text-sm text-white/70">
                  {uploadStatus.message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="inline-flex text-white/60 hover:text-white transition-all duration-200 hover:scale-110"
                  onClick={() => setUploadStatus(prev => ({ ...prev, error: false, message: '' }))}
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading Overlay - Glassmorphism style */}
      {uploadStatus.uploading && (
        <>
          {/* Backdrop with blur */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" />
          
          {/* Loading Modal */}
          <div className="fixed inset-0 z-[9999] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative transform overflow-hidden rounded-3xl bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl px-4 pb-4 pt-5 text-center sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                <div>
                  {/* Animated spinner with glow */}
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white/80 mx-auto shadow-[0_0_30px_rgba(255,255,255,0.5)]"></div>
                    <div className="absolute inset-0 animate-pulse rounded-full bg-white/10 blur-xl"></div>
                  </div>
                  <div className="mt-6">
                    <p className="text-lg font-semibold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                      Submitting...
                    </p>
                    <p className="mt-2 text-sm text-white/60">
                      {uploadStatus.message}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </>
        )}
        </div>
      )}
    </UniversalPageLayout>
  );
}
