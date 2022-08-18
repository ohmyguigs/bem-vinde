import Typography from '@mui/material/Typography';
import styles from '@/styles/css/AwesomeBanner.module.css';

export interface AwesomeBannerProps {
  title: string;
  subTitle: string;
  className?: string;
}

export default function AwesomeBanner({
  title,
  subTitle,
  className,
}: AwesomeBannerProps) {
  return (
    <div className={`${styles.wrapper} ${className || ``}`}>
      <div className={styles.container}>
        <Typography variant="h1" component="p" className={styles.glitch}>
          <span aria-hidden="true">{title}</span>
          {title}
          <span aria-hidden="true">{title}</span>
        </Typography>
        <Typography variant="subtitle1">{subTitle}</Typography>
      </div>
    </div>
  );
}
