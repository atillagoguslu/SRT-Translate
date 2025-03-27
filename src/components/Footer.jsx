function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="app-info">
          <h3>SRTTranslate</h3>
          <p>An SRT subtitle translation tool</p>
        </div>

        <div className="footer-links">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert("This is a demo app. No help documentation is available.");
            }}
          >
            Help
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert("This is a demo app created for educational purposes.");
            }}
          >
            About
          </a>
        </div>
      </div>

      <div className="copyright">
        <p>
          &copy; {new Date().getFullYear()} SRTTranslate - For Demo Purposes
        </p>
      </div>
    </footer>
  );
}

export default Footer;
