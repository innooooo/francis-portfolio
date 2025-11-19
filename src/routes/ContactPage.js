import { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';

const ContactPage = () => {
  const form = useRef();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // EmailJS Configuration
  const EMAILJS_CONFIG = {
    SERVICE_ID: 'service_wtdc66d',
    TEMPLATE_ID: 'template_q9w9ilj',
    PUBLIC_KEY: 'user_K14qUFCZr59uaesId',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('');

    try {
      const result = await emailjs.sendForm(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        form.current,
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      console.log('Email sent successfully:', result.text);
      setStatusMessage('Message sent successfully!');
      form.current.reset();
    } catch (error) {
      console.error('Failed to send email:', error);
      setStatusMessage('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      maxWidth: '500px',
      margin: '0 auto',
      padding: '30px',
      backgroundColor: '#F7F7FF',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(44, 44, 44, 0.1)'
    }}>
      <h2 style={{
        color: '#2D3561',
        marginBottom: '24px',
        fontSize: '28px',
        fontWeight: '600'
      }}>
        Get In Touch
      </h2>

      <form ref={form} onSubmit={handleSubmit}>
        {/* Name Field */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            color: '#2C2C2C',
            fontWeight: '500',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            Name
          </label>
          <input
            type="text"
            name="user_name"
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #4ECDC4',
              borderRadius: '8px',
              fontSize: '16px',
              transition: 'border-color 0.3s',
              outline: 'none',
              backgroundColor: '#fff',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
            onBlur={(e) => e.target.style.borderColor = '#4ECDC4'}
          />
        </div>

        {/* Phone Number Field */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            color: '#2C2C2C',
            fontWeight: '500',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            Phone Number
          </label>
          <input
            type="tel"
            name="user_phone"
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #4ECDC4',
              borderRadius: '8px',
              fontSize: '16px',
              transition: 'border-color 0.3s',
              outline: 'none',
              backgroundColor: '#fff',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
            onBlur={(e) => e.target.style.borderColor = '#4ECDC4'}
          />
        </div>

        {/* Message Field */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            color: '#2C2C2C',
            fontWeight: '500',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            Message
          </label>
          <textarea
            name="message"
            required
            rows="5"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #4ECDC4',
              borderRadius: '8px',
              fontSize: '16px',
              transition: 'border-color 0.3s',
              outline: 'none',
              resize: 'vertical',
              backgroundColor: '#fff',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
            onBlur={(e) => e.target.style.borderColor = '#4ECDC4'}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: isSubmitting ? '#ccc' : '#6c63ff',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            opacity: isSubmitting ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.target.style.backgroundColor = '#5850d6';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 12px rgba(108, 99, 255, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) {
              e.target.style.backgroundColor = '#6c63ff';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }
          }}
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>

      {/* Status Message */}
      {statusMessage && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          borderRadius: '8px',
          backgroundColor: statusMessage.includes('success') ? '#4CAF50' : '#ff6584',
          color: '#fff',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default ContactPage;
