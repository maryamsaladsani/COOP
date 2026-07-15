import { Link } from 'react-router-dom';
import Logo from './Logo';
import Button from './Button';
import './PublicHeader.css';

function PublicHeader() {
  return (
    <header className="public-header">
      <div className="public-header__inner">
        <Logo height={35} />
        <Link to="/signin">
          <Button variant="primary" size="sm">
            Sign in
          </Button>
        </Link>
      </div>
    </header>
  );
}

export default PublicHeader;
