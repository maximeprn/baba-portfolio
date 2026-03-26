import { siteConfig, getActiveSocialLinks } from '../data/siteConfig';

function Contact() {
  const { contact } = siteConfig;
  const socialLinks = getActiveSocialLinks();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full px-6 py-12">
      <h1 className="font-header text-4xl md:text-5xl text-center mb-12">
        CONTACT
      </h1>

      <div className="flex flex-col items-center gap-6">
        {/* Email */}
        <a
          href={`mailto:${contact.email}`}
          className="font-body text-base hover:opacity-70 transition-opacity"
        >
          {contact.email}
        </a>

        {/* Social Links */}
        {socialLinks.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-base hover:opacity-70 transition-opacity"
          >
            {social.name}
          </a>
        ))}
      </div>
    </div>
  );
}

export default Contact;
