import ROLE_ITEMS from './roleIcons';
import './RoleIconList.css';

function RoleIconList() {
  return (
    <ul className="role-icon-list">
      {ROLE_ITEMS.map((item) => (
        <li className="role-icon-list__item" key={item.title}>
          <span className="role-icon-list__icon">{item.icon}</span>
          <span className="role-icon-list__text">
            <span className="role-icon-list__title">{item.title}</span>
            <span className="role-icon-list__blurb">{item.blurb}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default RoleIconList;
