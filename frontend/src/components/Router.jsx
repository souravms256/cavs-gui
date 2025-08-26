export default function Router({ children, page }) {
  return children.find(child => child.props.path === page) || <div>Page Not Found</div>;
}
