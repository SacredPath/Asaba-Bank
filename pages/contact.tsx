import Head from 'next/head';
import Layout from '@/components/Layout';
import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    department: 'general'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Explicitly type the event as React.FormEvent<HTMLFormElement>
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate form submission (in production, replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmissionSuccess(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
    }
  };

  // Explicitly type the event as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Layout>
      <Head>
        <title>Contact Us | AsabaBank</title>
        <meta
          name="description"
          content="Contact AsabaBank for support, inquiries, or to speak with a specialist. We're here to help you with all your banking needs."
        />
      </Head>

      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-indigo-800 mb-4">Contact Us</h1>
            <p className="text-xl text-gray-600">
              We're here to help! Whether you have questions about our products or need assistance with your account, our team is ready to assist you.
            </p>
          </div>

          {/* Contact Information Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Main Office */}
            <div className="bg-indigo-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-indigo-700 mb-4">Main Office</h3>
              <div className="space-y-3 text-gray-600">
                <p>1234 Main Street</p>
                <p>Minneapolis, MN 55401</p>
                <p className="font-semibold">(612) 555-0123</p>
                <p className="text-sm">Mon-Fri: 9:00 AM - 5:00 PM</p>
                <p className="text-sm">Sat: 9:00 AM - 1:00 PM</p>
              </div>
            </div>

            {/* Customer Service */}
            <div className="bg-indigo-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-indigo-700 mb-4">Customer Service</h3>
              <div className="space-y-3 text-gray-600">
                <p className="font-semibold">(612) 555-0124</p>
                <p className="text-sm">24/7 Support Available</p>
                <p className="text-sm">Online Banking Support</p>
                <p className="text-sm">Mobile App Assistance</p>
              </div>
            </div>

            {/* Mortgage Department */}
            <div className="bg-indigo-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-indigo-700 mb-4">Mortgage Department</h3>
              <div className="space-y-3 text-gray-600">
                <p className="font-semibold">(612) 555-0125</p>
                <p className="text-sm">Mon-Fri: 8:00 AM - 6:00 PM</p>
                <p className="text-sm">NMLS #: 1234567</p>
                <p className="text-sm">ITIN Loan Specialists</p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-xl font-semibold text-indigo-700 mb-4">Banking Information</h3>
              <div className="space-y-2 text-gray-600">
                <p><span className="font-semibold">Routing Number:</span> 123456789</p>
                <p><span className="font-semibold">NMLS Number:</span> 1234567</p>
                <p><span className="font-semibold">FDIC Certificate:</span> 12345</p>
                <p><span className="font-semibold">Email:</span> support@asababank.com</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-xl font-semibold text-indigo-700 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <a href="/account/open" className="block text-indigo-600 hover:text-indigo-800">Open an Account</a>
                <a href="/auth/login" className="block text-indigo-600 hover:text-indigo-800">Online Banking</a>
                <a href="/mortgages" className="block text-indigo-600 hover:text-indigo-800">Mortgage Services</a>
                <a href="/help" className="block text-indigo-600 hover:text-indigo-800">Help Center</a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-xl shadow">
            <h2 className="text-2xl font-semibold text-indigo-700 mb-8">Send Us a Message</h2>

            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="general">General Inquiry</option>
                  <option value="mortgage">Mortgage Services</option>
                  <option value="banking">Banking Services</option>
                  <option value="support">Technical Support</option>
                  <option value="complaints">Complaints</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                {submissionSuccess ? (
                  <div className="bg-green-50 p-4 rounded-lg text-green-700">
                    Thank you for your message! We'll get back to you within 24 hours.
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
}
