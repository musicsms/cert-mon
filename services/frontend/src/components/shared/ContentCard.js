import { Card, CardContent, Typography } from '@mui/material';

const ContentCard = ({ title, value, color = 'primary.dark' }) => {
  return (
    <Card sx={{ 
      bgcolor: color,
      color: 'white',
      borderRadius: 2,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s',
      '&:hover': { 
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
      }
    }}>
      <CardContent sx={{ 
        p: { xs: 2, sm: 3 },
        '&:last-child': { pb: { xs: 2, sm: 3 } }
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 500,
          fontSize: { xs: '1rem', sm: '1.1rem' },
          color: 'white',
          opacity: 0.9,
          mb: 1
        }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ 
          fontWeight: 600,
          fontSize: { xs: '1.75rem', sm: '2rem' },
          color: 'white'
        }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ContentCard;
