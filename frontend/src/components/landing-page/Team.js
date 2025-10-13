import React, { useState, useEffect } from 'react';
import './Team.css';
import api from '../../services/api';

const socialIcons = {
  github: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  twitter: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  dribbble: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  facebook: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
};

const Team = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [sectionTitle, setSectionTitle] = useState('Our Team');
  const [sectionSubtitle, setSectionSubtitle] = useState('Worem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.');
  const [loading, setLoading] = useState(true);

  // Fetch team data from API
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        
        // Fetch both section details and team members in parallel
        const [sectionResponse, membersResponse] = await Promise.all([
          api.team.getSection(),
          api.team.getMembers()
        ]);
        
        if (sectionResponse.success) {
          setSectionTitle(sectionResponse.section_title);
          setSectionSubtitle(sectionResponse.section_subtitle);
        }
        
        if (membersResponse.success) {
          setTeamMembers(membersResponse.members);
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
        // Fallback to empty array if API fails
        setTeamMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, []);

  return (
    <section className="team-section" id="team">
      <div className="team-container">
        <h2 className="section-title">{sectionTitle}</h2>
        <p className="section-subtitle">
          {sectionSubtitle}
        </p>

        <div className="team-grid">
          {loading ? (
            <div className="team-loading">Loading team members...</div>
          ) : (
            teamMembers.map((member) => (
              <div className="team-card" key={member.id}>
                <div className="team-avatar">
                  {member.image_url ? (
                    <img
                      src={member.image_url}
                      alt={member.name}
                      className="team-avatar-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <div className="avatar-placeholder" style={{ display: member.image_url ? 'none' : 'flex' }}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="team-info">
                  <h3 className="member-name">{member.name}</h3>
                  <p className="member-role">{member.role}</p>
                  <p className="member-description">{member.description}</p>
                  <div className="social-links">
                    {member.social_links && Object.keys(member.social_links).map((social) => (
                      <a 
                        href={member.social_links[social]} 
                        className="social-link" 
                        key={social}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {socialIcons[social]}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Team;
