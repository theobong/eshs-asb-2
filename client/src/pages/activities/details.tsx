import { useState, useEffect, useRef } from "react";
import { useLocation as useWouterLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PrimaryButton } from "@/components/ThemedComponents";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";
import { BlurContainer, BlurActionButton } from "@/components/UniversalBlurComponents";
import { getEvents, createFormSubmission, type Event } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { Check, Ticket } from "lucide-react";

interface FormData {
  studentId: File | null;
  customForms: { [key: string]: File | null };
  studentName: string;
  email: string;
  quantity: number;
  notes: string;
}

interface FormUploadStatus {
  uploading: boolean;
  success: boolean;
  error: boolean;
  message: string;
}

interface UploadedForm {
  fileName: string;
  fileUrl: string;
  fileType: string;
}

const MAX_TICKETS_PER_ORDER = 10;

export default function EventDetails() {
  const [, setLocation] = useWouterLocation();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketType, setSelectedTicketType] = useState<number | null>(null);
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

  const fileInputRefs = {
    studentId: useRef<HTMLInputElement>(null),
  };

  const customFormRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  useEffect(() => {
    const loadEventData = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentPath = window.location.pathname;
        const matches = currentPath.match(/\/activities\/details\/(.+)$/);

        if (matches) {
          const id = matches[1];

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

  const getSelectedTicketType = () => {
    if (!event?.ticketTypes || event.ticketTypes.length === 0 || selectedTicketType === null) return null;
    return event.ticketTypes[selectedTicketType] ?? null;
  };

  const getEventPrice = () => getSelectedTicketType()?.price ?? 0;

  const getMaxTickets = () => getSelectedTicketType()?.maxTickets;

  const getMaxAllowedQuantity = (maxTickets?: number) =>
    maxTickets && maxTickets > 0 ? Math.min(MAX_TICKETS_PER_ORDER, maxTickets) : MAX_TICKETS_PER_ORDER;

  const handleQuantityChange = (quantity: number) => {
    const maxAllowed = getMaxAllowedQuantity(getMaxTickets());
    setFormData(prev => ({
      ...prev,
      quantity: Math.max(1, Math.min(quantity, maxAllowed))
    }));
  };

  const handleSelectTicketType = (index: number) => {
    setSelectedTicketType(index);
    const maxAllowed = getMaxAllowedQuantity(event?.ticketTypes?.[index]?.maxTickets);
    setFormData(prev => ({
      ...prev,
      quantity: Math.max(1, Math.min(prev.quantity, maxAllowed))
    }));
  };

  const handleStudentIdUpload = (file: File | null) => {
    setFormData(prev => ({
      ...prev,
      studentId: file
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

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmitApproval = async () => {
    if (!event) return;

    if (event.ticketTypes && event.ticketTypes.length > 0 && selectedTicketType === null) {
      setUploadStatus({
        uploading: false,
        success: false,
        error: true,
        message: 'Please select a ticket type before submitting'
      });
      return;
    }

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
      const uploadedForms: UploadedForm[] = [];

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
          const failureText = await uploadResponse.text();
          throw new Error(failureText || 'We could not upload your forms. Please check the files and try again.');
        }

        const uploadedFiles: UploadedForm[] = await uploadResponse.json();

        if (!Array.isArray(uploadedFiles) || uploadedFiles.length !== filesToUpload.length) {
          throw new Error('Some of your forms did not upload. Please try again.');
        }

        uploadedFiles.forEach((uploadedFile, index) => {
          uploadedForms.push({
            fileName: fileLabels[index],
            fileUrl: uploadedFile.fileUrl,
            fileType: uploadedFile.fileType
          });
        });
      }

      const selectedTicket = getSelectedTicketType();
      await createFormSubmission({
        eventId: event._id,
        studentName: formData.studentName,
        email: formData.email,
        forms: uploadedForms,
        quantity: 1,
        totalAmount: selectedTicket ? selectedTicket.price * 1 : 0,
        notes: formData.notes,
        status: 'pending',
        ticketType: selectedTicket ? {
          name: selectedTicket.name,
          price: selectedTicket.price,
          description: selectedTicket.description
        } : undefined
      });

      setUploadStatus({
        uploading: false,
        success: true,
        error: false,
        message: 'Your forms have been submitted successfully. You will receive an email when your request is approved.'
      });

      setFormData({
        studentId: null,
        customForms: {},
        studentName: '',
        email: '',
        quantity: 1,
        notes: ''
      });
      setSelectedTicketType(null);

    } catch (submitError) {
      console.error('Form submission failed:', submitError);
      setUploadStatus({
        uploading: false,
        success: false,
        error: true,
        message: submitError instanceof Error && submitError.message
          ? submitError.message
          : 'Failed to submit forms. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectPurchase = () => {
    if (!event) return;

    if (event.ticketTypes && event.ticketTypes.length > 0 && selectedTicketType === null) {
      setUploadStatus({
        uploading: false,
        success: false,
        error: true,
        message: 'Please select a ticket type before adding to cart'
      });
      return;
    }

    const selectedTicket = getSelectedTicketType();
    const cartItem = {
      id: event._id,
      name: selectedTicket ? `${event.title} - ${selectedTicket.name}` : event.title,
      price: getEventPrice(),
      quantity: formData.quantity,
      type: 'event' as const,
      eventId: event._id,
      ticketType: selectedTicket?.name,
      image: "/api/placeholder/300/300"
    };

    addToCart(cartItem);
    sessionStorage.setItem('cart-referrer', `/activities/details/${event._id}`);
    setLocation("/shop/cart");
  };

  if (loading) {
    return (
      <UniversalPageLayout pageType="information" title="Event Details" backButtonText="Back to Activities" onBackClick={handleBackClick}>
        {({ contentVisible }) => (
          <BlurContainer contentVisible={contentVisible} className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
            <p className="text-white">Loading event...</p>
          </BlurContainer>
        )}
      </UniversalPageLayout>
    );
  }

  if (!event) {
    return (
      <UniversalPageLayout pageType="information" title="Event Not Found" backButtonText="Back to Activities" onBackClick={handleBackClick}>
        {({ contentVisible }) => (
          <BlurContainer contentVisible={contentVisible} className="p-6 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 break-words">Event Not Found</h1>
              <p className="text-gray-300 mb-6">{error ?? "The event you're looking for doesn't exist."}</p>
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

  const availableTicketTypes = (event.ticketTypes ?? [])
    .map((ticket, index) => ({ ticket, index }))
    .filter(({ ticket }) => ticket.maxTickets > 0);
  const hasTicketTypes = (event.ticketTypes?.length ?? 0) > 0;
  const needsTicketTypeSelection = hasTicketTypes && selectedTicketType === null;
  const maxQuantity = getMaxAllowedQuantity(getMaxTickets());

  return (
    <UniversalPageLayout pageType="information" title="Event Details" backButtonText="Back" onBackClick={handleBackClick}>
      {({ contentVisible }) => (
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <div
            className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl mb-8 transform transition-all duration-500 ease-out"
            style={{
              opacity: contentVisible ? 1 : 0,
              transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
              transitionDelay: '200ms'
            }}
          >
            <div className="p-5 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white break-words">{event.title}</h2>
                    {event.requiresApproval && (
                      <Badge variant="outline" className="bg-orange-500/20 text-orange-200 border-orange-500/30">
                        Requires Approval
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="self-start text-base sm:text-lg px-3 py-1 whitespace-nowrap">
                  {event.category}
                </Badge>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start text-base sm:text-lg">
                  <svg className="w-6 h-6 mr-3 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-200 break-words">{formatDate(event.date)}</span>
                </div>
                <div className="flex items-start text-base sm:text-lg">
                  <svg className="w-6 h-6 mr-3 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-200 break-words">{event.time}</span>
                </div>
                <div className="flex items-start text-base sm:text-lg">
                  <svg className="w-6 h-6 mr-3 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-200 break-words">{event.location}</span>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-300 text-base sm:text-lg leading-relaxed break-words">{event.description}</p>
              </div>
            </div>
          </div>

          {hasTicketTypes && (
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
                {availableTicketTypes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {availableTicketTypes.map(({ ticket, index }) => (
                      <button
                        key={index}
                        type="button"
                        className={`w-full min-h-11 p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                          selectedTicketType === index
                            ? 'border-blue-400 bg-blue-500/10 shadow-lg'
                            : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                        }`}
                        onClick={() => handleSelectTicketType(index)}
                      >
                        <div className="text-center">
                          <div className="font-semibold text-white text-sm mb-1 break-words">{ticket.name}</div>
                          <div className="text-xl font-bold text-green-400 mb-1">${ticket.price.toFixed(2)}</div>
                          <div className="text-xs text-gray-300 break-words">{ticket.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Ticket className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                    <div className="text-xl font-bold text-red-400 mb-1">SOLD OUT</div>
                    <div className="text-gray-400 text-sm">All ticket types for this event are currently sold out.</div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div
            className="border-t border-white/10 pt-6 mt-6 transform transition-all duration-500 ease-out"
            style={{
              opacity: contentVisible ? 1 : 0,
              transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
              transitionDelay: '400ms'
            }}
          >
            {event.requiresApproval ? (
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">Approval Request Form</h3>

                {!uploadStatus.success && (
                  <div
                    className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl p-4 sm:p-6 transform transition-all duration-500 ease-out"
                    style={{
                      opacity: contentVisible ? 1 : 0,
                      transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
                      transitionDelay: '500ms'
                    }}
                  >
                    <form className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="studentName" className="text-white mb-2 block">Student Name</Label>
                          <Input
                            id="studentName"
                            value={formData.studentName}
                            onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                            placeholder="Enter your full name"
                            className="h-11 w-full bg-white/5 border-white/20 text-white"
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
                            className="h-11 w-full bg-white/5 border-white/20 text-white"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-lg sm:text-xl font-semibold text-white">Required Forms</h4>

                        {event.requiredForms?.studentIdRequired && (
                          <div>
                            <Label htmlFor="studentId" className="text-white mb-2 flex items-center gap-1">
                              <span>Student ID</span>
                              {formData.studentId ? <Check className="h-4 w-4 text-green-400" /> : <span>*</span>}
                            </Label>
                            <Input
                              id="studentId"
                              type="file"
                              ref={fileInputRefs.studentId}
                              onChange={(e) => handleStudentIdUpload(e.target.files?.[0] || null)}
                              className="h-11 w-full bg-white/5 border-white/20 text-white file:text-white"
                              accept=".jpg,.jpeg,.png,.pdf"
                              required
                            />
                            <p className="text-xs text-gray-400 mt-1">Upload a photo or scan of your student ID</p>
                          </div>
                        )}

                        {event.requiredForms?.customForms && event.requiredForms.customForms.length > 0 && (
                          <div className="space-y-3">
                            {event.requiredForms.customForms.map((customForm, index) => (
                              <div key={index}>
                                <Label htmlFor={`customForm_${index}`} className="text-white mb-2 flex items-center gap-1">
                                  <span className="break-words">{customForm.name}</span>
                                  {formData.customForms[customForm.name]
                                    ? <Check className="h-4 w-4 flex-shrink-0 text-green-400" />
                                    : (customForm.required !== false ? <span>*</span> : null)}
                                </Label>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <Input
                                    id={`customForm_${index}`}
                                    type="file"
                                    ref={(el) => { customFormRefs.current[customForm.name] = el; }}
                                    onChange={(e) => handleCustomFileUpload(customForm.name, e.target.files?.[0] || null)}
                                    className="h-11 w-full bg-white/5 border-white/20 text-white file:text-white"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    required={customForm.required !== false}
                                  />
                                  {customForm.pdfUrl && (
                                    <a
                                      href={customForm.pdfUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-300 hover:text-blue-200 text-sm whitespace-nowrap py-2"
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

                      <div className="pt-2">
                        <PrimaryButton
                          type="button"
                          onClick={handleSubmitApproval}
                          disabled={isSubmitting || uploadStatus.uploading || uploadStatus.success || needsTicketTypeSelection}
                          className="w-full min-h-11 py-3 text-base sm:text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Submitting...
                            </>
                          ) : needsTicketTypeSelection ? 'Select Ticket Type First' : 'Submit for Approval'}
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
              <div
                className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl p-4 sm:p-6 transform transition-all duration-500 ease-out"
                style={{
                  opacity: contentVisible ? 1 : 0,
                  transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
                  transitionDelay: '500ms'
                }}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-2xl sm:text-3xl font-bold text-white">${getEventPrice().toFixed(2)}</div>
                      {selectedTicketType !== null && (
                        <Badge variant="outline" className="bg-green-500/20 text-green-200 border-green-500/30 px-2 py-1">
                          Available
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <label htmlFor="ticketQuantity" className="text-white">Quantity:</label>
                      <div className="flex items-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 flex-shrink-0 bg-white/5 border-white/20 text-white"
                          onClick={() => handleQuantityChange(formData.quantity - 1)}
                          disabled={formData.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </Button>
                        <Input
                          id="ticketQuantity"
                          type="number"
                          inputMode="numeric"
                          value={formData.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            if (!isNaN(value)) {
                              handleQuantityChange(value);
                            }
                          }}
                          onBlur={() => handleQuantityChange(formData.quantity)}
                          className="h-11 w-16 flex-shrink-0 text-center mx-2 bg-white/5 border-white/20 text-white"
                          min={1}
                          max={maxQuantity}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 flex-shrink-0 bg-white/5 border-white/20 text-white"
                          onClick={() => handleQuantityChange(formData.quantity + 1)}
                          disabled={formData.quantity >= maxQuantity}
                          aria-label="Increase quantity"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-4">
                      <div className="text-white text-base sm:text-lg font-medium">Total:</div>
                      <div className="text-white text-lg sm:text-xl font-bold">${(getEventPrice() * formData.quantity).toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="flex-1 flex items-end justify-center md:justify-end">
                    <PrimaryButton
                      type="button"
                      onClick={handleDirectPurchase}
                      disabled={needsTicketTypeSelection}
                      className="w-full md:w-auto min-h-11 px-8 py-4 text-base sm:text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {needsTicketTypeSelection ? 'Select Ticket Type' : 'Add to Cart'}
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            )}
          </div>

          {uploadStatus.success && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" />

          <div className="fixed inset-0 z-[9999] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <div className="relative transform w-[95vw] max-h-[85vh] overflow-y-auto rounded-3xl bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl px-4 pb-4 pt-5 text-left transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-8">
                <div className="text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-500/20 backdrop-blur-xl border border-green-500/30 mb-6 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                    <svg className="h-14 w-14 text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">
                    Success!
                  </h3>

                  <div className="mb-8">
                    <p className="text-white text-lg mb-3">
                      Your form has been submitted for approval
                    </p>
                    <p className="text-white/60 text-sm leading-relaxed">
                      You'll receive an email notification once your request is reviewed. After approval, you'll be able to complete your ticket purchase.
                    </p>
                  </div>

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

      {uploadStatus.error && !uploadStatus.uploading && (
        <div className="fixed bottom-4 left-4 right-4 z-[9999] sm:left-auto sm:max-w-md animate-in slide-in-from-right duration-300">
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
                  type="button"
                  aria-label="Dismiss error"
                  className="inline-flex h-11 w-11 items-center justify-center text-white/60 hover:text-white transition-all duration-200 hover:scale-110"
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

      {uploadStatus.uploading && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" />

          <div className="fixed inset-0 z-[9999] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative transform w-[95vw] overflow-hidden rounded-3xl bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl px-4 pb-4 pt-5 text-center sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                <div>
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
