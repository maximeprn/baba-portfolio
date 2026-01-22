/**
 * ============================================================================
 * CONTACT PAGE
 * ============================================================================
 *
 * Provides ways for visitors to get in touch.
 * Includes a contact form AND displayed contact information.
 *
 * URL: /contact
 *
 * PAGE STRUCTURE:
 * 1. Page title
 * 2. Contact form (uses Formspree for submission)
 * 3. Direct contact information (email, social links)
 *
 * FORM HANDLING:
 * The form uses Formspree (https://formspree.io) to handle submissions.
 * To set up:
 * 1. Create a free account at formspree.io
 * 2. Create a new form
 * 3. Copy your form ID
 * 4. Replace 'YOUR_FORMSPREE_ID' in siteConfig.js
 *
 * ============================================================================
 */

// useState hook for form state management
import { useState } from 'react';

// Import site configuration
import { siteConfig, getActiveSocialLinks } from '../data/siteConfig';


/**
 * Contact Page Component
 *
 * Displays contact form and contact information.
 *
 * @returns {JSX.Element} The Contact page
 */
function Contact() {
  // Get config values
  const { contact, contactForm: formConfig } = siteConfig;
  const socialLinks = getActiveSocialLinks();


  // =========================================================================
  // FORM STATE
  // =========================================================================

  // Form field values
  // useState creates a "state variable" that React tracks
  // When it changes, the component re-renders
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  // Form submission status
  // 'idle' | 'submitting' | 'success' | 'error'
  const [status, setStatus] = useState('idle');


  /**
   * Handle form field changes
   *
   * This function is called every time the user types in a field.
   * It updates the corresponding field in formData.
   *
   * @param {Event} e - The input change event
   */
  const handleChange = (e) => {
    // Destructure the name and value from the input element
    const { name, value } = e.target;

    // Update the formData state
    // The spread operator (...formData) copies all existing values
    // Then we override the specific field that changed: [name]: value
    setFormData({
      ...formData,
      [name]: value,
    });
  };


  /**
   * Handle form submission
   *
   * Sends the form data to Formspree for processing.
   *
   * @param {Event} e - The form submit event
   */
  const handleSubmit = async (e) => {
    // Prevent the default form submission (which would reload the page)
    e.preventDefault();

    // Set status to submitting (shows loading state)
    setStatus('submitting');

    try {
      // Send the form data to Formspree
      // fetch() is the browser's built-in way to make HTTP requests
      const response = await fetch(
        `https://formspree.io/f/${formConfig.formspreeId}`,
        {
          method: 'POST',
          // Send form data as JSON
          body: JSON.stringify(formData),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      // Check if the request was successful
      if (response.ok) {
        // Success! Clear the form and show success message
        setStatus('success');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });
      } else {
        // Server returned an error
        setStatus('error');
      }
    } catch (error) {
      // Network error or other issue
      console.error('Form submission error:', error);
      setStatus('error');
    }
  };


  return (
    // Main page container
    <div
      className="
        flex
        flex-col
        items-center
        w-full
        max-w-container
        px-6
        py-12
      "
    >
      {/* PAGE HEADER */}
      <header className="w-full max-w-3xl mb-12">
        <h1
          className="
            font-header
            text-4xl
            md:text-5xl
            text-center
            mb-4
          "
        >
          GET IN TOUCH
        </h1>
        <p className="font-body text-center text-muted">
          Interested in working together? Send me a message.
        </p>
      </header>


      {/* MAIN CONTENT - Two column layout on desktop */}
      <div
        className="
          w-full
          max-w-4xl
          grid
          grid-cols-1
          md:grid-cols-2
          gap-12
          md:gap-16
        "
      >
        {/* CONTACT FORM */}
        <section>
          <h2
            className="
              font-header
              text-lg
              uppercase
              tracking-wider
              mb-6
            "
          >
            Send a Message
          </h2>

          {/* Success Message */}
          {status === 'success' && (
            <div
              className="
                mb-6
                p-4
                bg-green-50
                border
                border-green-200
                text-green-800
                font-body
                text-sm
              "
              role="alert"
            >
              {formConfig.successMessage}
            </div>
          )}

          {/* Error Message */}
          {status === 'error' && (
            <div
              className="
                mb-6
                p-4
                bg-red-50
                border
                border-red-200
                text-red-800
                font-body
                text-sm
              "
              role="alert"
            >
              {formConfig.errorMessage}
            </div>
          )}

          {/* The Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
          >
            {/* Name Field */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="name"
                className="font-header text-xs uppercase tracking-wider"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={formConfig.placeholders.name}
                required
                className="
                  w-full
                  px-4
                  py-3
                  border
                  border-border
                  font-body
                  text-base
                  bg-white
                  focus:outline-none
                  focus:border-primary
                  transition-colors
                "
              />
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="font-header text-xs uppercase tracking-wider"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={formConfig.placeholders.email}
                required
                className="
                  w-full
                  px-4
                  py-3
                  border
                  border-border
                  font-body
                  text-base
                  bg-white
                  focus:outline-none
                  focus:border-primary
                  transition-colors
                "
              />
            </div>

            {/* Subject Field */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="subject"
                className="font-header text-xs uppercase tracking-wider"
              >
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder={formConfig.placeholders.subject}
                className="
                  w-full
                  px-4
                  py-3
                  border
                  border-border
                  font-body
                  text-base
                  bg-white
                  focus:outline-none
                  focus:border-primary
                  transition-colors
                "
              />
            </div>

            {/* Message Field */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="message"
                className="font-header text-xs uppercase tracking-wider"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder={formConfig.placeholders.message}
                required
                rows={6}
                className="
                  w-full
                  px-4
                  py-3
                  border
                  border-border
                  font-body
                  text-base
                  bg-white
                  focus:outline-none
                  focus:border-primary
                  transition-colors
                  resize-none
                "
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="
                w-full
                md:w-auto
                px-8
                py-3
                bg-primary
                text-white
                font-header
                text-sm
                uppercase
                tracking-wider
                hover:bg-accent
                disabled:bg-muted
                disabled:cursor-not-allowed
                transition-colors
                duration-150
              "
            >
              {status === 'submitting' ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </section>


        {/* CONTACT INFORMATION */}
        <section>
          <h2
            className="
              font-header
              text-lg
              uppercase
              tracking-wider
              mb-6
            "
          >
            Contact Info
          </h2>

          <div className="flex flex-col gap-8">
            {/* Email */}
            <div>
              <h3 className="font-header text-xs uppercase tracking-wider text-muted mb-2">
                Email
              </h3>
              <a
                href={`mailto:${contact.email}`}
                className="
                  font-body
                  text-base
                  hover:text-muted
                  transition-colors
                "
              >
                {contact.email}
              </a>
            </div>

            {/* Location */}
            <div>
              <h3 className="font-header text-xs uppercase tracking-wider text-muted mb-2">
                Location
              </h3>
              <p className="font-body text-base">
                {contact.location}
              </p>
            </div>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div>
                <h3 className="font-header text-xs uppercase tracking-wider text-muted mb-2">
                  Social
                </h3>
                <div className="flex flex-col gap-2">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        font-body
                        text-base
                        hover:text-muted
                        transition-colors
                      "
                    >
                      {social.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Response Time Note */}
            <div className="pt-4 border-t border-border">
              <p className="font-body text-sm text-muted">
                I typically respond within 24-48 hours.
              </p>
            </div>
          </div>
        </section>
      </div>


      {/* BOTTOM SPACING */}
      <div className="h-20" aria-hidden="true" />
    </div>
  );
}

// Export for use in App.jsx router
export default Contact;
