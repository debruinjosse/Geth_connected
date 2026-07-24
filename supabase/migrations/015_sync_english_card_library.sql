-- Synchronizes official English GETH card text from GETH_cards_full_English.xlsx.
-- Safe by design: updates card text by card_number only and preserves id, qr_slug, active, and recognition references.

do $$
begin
  if (
    select count(*)
    from public.card_library
    where card_number between 1 and 53
  ) <> 53 then
    raise exception 'Expected 53 existing card_library rows before syncing English card content.';
  end if;
end $$;

with official_cards(card_number, title, category, description, recognition_sentence) as (
values
  (1, 'Listener', 'Communication', 'You give people the space to tell their full story without interruption. Through your attention, people feel heard and taken seriously.', 'You listened to me today with genuine interest, without interrupting. I truly felt heard.'),
  (2, 'Clear Communicator', 'Communication', 'You translate complex situations into understandable language, tailored to the other person. You know exactly how to communicate something in the right way so it truly lands.', 'Thanks to your clear explanation, I understood exactly what was meant.'),
  (3, 'Honest', 'Communication', 'You say what needs to be said in a clear and respectful way. Through your honesty, clarity emerges and others know where they stand.', 'I appreciate that you named it honestly. It brought clarity and helped us make a better choice.'),
  (4, 'Uniter', 'Communication', 'You see what people have in common and bring them together naturally. This creates connections that strengthen both the work and the collaboration.', 'You bring people together who help and strengthen each other. It is second nature to you.'),
  (5, 'Empathetic', 'Communication', 'You sense what someone needs, even when it has not been spoken out loud. Your compassion and ability to put yourself in someone else''s position make collaboration more human.', 'With you, I do not have to explain everything. You sense the atmosphere and understand the situation. I feel truly understood.'),
  (6, 'Persuasive', 'Communication', 'You know how to bring people along with your story without forcing anything. You combine logic with feeling, which naturally creates movement.', 'You convinced me today not with pressure, but with insight. That allowed me to say yes wholeheartedly, and it truly felt like my own choice.'),
  (7, 'Hospitable', 'Communication', 'You make people feel welcome from the very first moment. You have a natural sense of what someone needs to feel at ease.', 'You made me feel welcome today. That is not something to take for granted, and it makes me want to come here again.'),
  (8, 'Inspiring', 'Communication', 'Through your words and energy, you give people the desire to start or keep going. After a conversation with you, more feels possible.', 'After our conversation, I felt renewed energy to keep going. You helped me to see that it is possible.'),
  (9, 'Diplomatic', 'Communication', 'You sense when a conversation becomes difficult and know exactly which softening words to choose. As a result, you prevent situations from escalating and keep everyone involved.', 'The way you chose the right words kept the conversation calm and made sure everyone continued to listen.'),
  (10, 'Guiding', 'Communication', 'You give clear direction without dominating. When others are uncertain, you offer practical handles and show which possibilities exist to move forward.', 'You gave us exactly the clarity and guidance we needed to move forward.'),
  (11, 'Curious', 'Communication', 'You want to understand every side of a story. Through your questions, depth emerges and people gain a more complete picture of what is going on.', 'Your questions made me look further than I would have on my own. Only then did I truly understand the situation.'),
  (12, 'Enthusiastic', 'Communication', 'You bring life into a conversation. Your enthusiasm is contagious.', 'Every time you speak, I become enthusiastic and want to help. That is simply a gift you have.'),
  (13, 'Trustworthy', 'Communication', 'You have the ability to calm people in uncertain moments. Your words and presence bring calm to those who need it.', 'You helped me calm down exactly when I needed it. Because of you, I feel at ease again.'),
  (14, 'Innovative', 'Creativity', 'You think outside the box. Your ideas open windows that others had not yet seen. You bring a fresh, innovative view of what could be possible.', 'Your idea brought exactly the fresh perspective we needed, and it truly delivered something valuable.'),
  (15, 'Adventurous', 'Creativity', 'You embrace the unknown. Where others become cautious, you see an opportunity. Your willingness to take risks opens new paths for the whole team.', 'You dared to take a step today that we all found exciting. Thanks to you, we are moving forward.'),
  (16, 'Humorous', 'Creativity', 'You bring joy, lightness and positivity into situations that risk getting stuck. Thanks to your humor, it feels good to take part.', 'Your humor immediately made everything feel lighter and gave the group positive energy again.'),
  (17, 'Visionary', 'Creativity', 'You can picture what may be possible in the long term and give direction to it. In doing so, you help others look beyond today.', 'You showed me where we could stand in the future. That suddenly made it concrete and tangible.'),
  (18, 'Investigative', 'Creativity', 'You ask sharp questions and uncover insights that help others make better choices.', 'Because you looked further than the rest and kept asking questions, you helped us make a better decision. Without you, we would have missed that.'),
  (19, 'Authentic', 'Creativity', 'You are not led by what is conventional. In what you create or say, there is something uniquely yours that is recognizable and distinctive.', 'I immediately recognize you in what you create, do or say. You always bring something that is truly your own.'),
  (20, 'Observant', 'Creativity', 'You see what others do not see, simply because of the way you look. Details, atmosphere, what is happening beneath the surface, nothing escapes you.', 'You noticed something today that the rest of us had missed. Thanks to you, we did not let it slip by.'),
  (21, 'Polished', 'Creativity', 'You never deliver half-finished work. What you create looks good. That sense of quality reflects on everything you touch.', 'What you created today radiated quality and was cared for down to the smallest detail. That is your standard.'),
  (22, 'Problem Solver', 'Creativity', 'You see problems as invitations to look differently. Where others get stuck, you often discover a creative way through.', 'You saw an opportunity where we mainly saw a problem. It is valuable that you saw that.'),
  (23, 'Intuitive', 'Creativity', 'You dare to trust your feeling. Your intuition is not a random impulse, but a sensitivity for what is right in the moment.', 'You sensed flawlessly what was needed here, even before everything had been said.'),
  (24, 'Improviser', 'Creativity', 'You remain calm when plans change. You turn unexpected situations into something useful.', 'The way you adapted so smoothly helped all of us stay calm as well.'),
  (25, 'Challenger', 'Creativity', 'You constructively challenge the status quo. You ask the question, ''But why, actually?'' And that question creates insight.', 'You showed me my own assumptions today. It was uncomfortable, but clarifying — exactly what I needed.'),
  (26, 'Dreamer', 'Creativity', 'You dare to think big. Your dreams are the seeds of the future, both for you and for others.', 'Your dream today gave me the courage to dare to think big as well.'),
  (27, 'Goal-Oriented', 'Competence', 'You know what you are working toward and keep a sharp focus on what truly matters. This helps others stay focused on the goal.', 'You kept us focused on the essence when we were about to drift away. Thanks to you, we kept the goal in sight.'),
  (28, 'Analytical', 'Competence', 'You see structure where others see chaos. You dissect problems with precision and quickly find the heart of the matter.', 'Your analysis brought calm to something that was unclear to us. Clear and direct, that gave me confidence.'),
  (29, 'Reliable', 'Competence', 'You do what you say, always. Your reliability is the foundation others dare to build on.', 'I can build on you; that gives stability to me, to the team and to the result.'),
  (30, 'Strategic', 'Competence', 'You think three steps ahead. You see patterns and opportunities that others do not yet see, and you provide insights that hold true in the long term.', 'Today, you saw what this decision will mean two years from now.'),
  (31, 'Precise', 'Competence', 'You miss nothing. Your eye for detail protects quality, even when others would already be satisfied.', 'You saw what we did not see. And because of that, our work became truly good.'),
  (32, 'Decisive in Action', 'Competence', 'You move when others are still weighing things up. Through your decisiveness, momentum is created and it becomes easier for others to join in.', 'The fact that you simply started gave all of us the push we needed.'),
  (33, 'Eager to Learn', 'Competence', 'You grow consciously. You seek feedback, embrace discomfort and turn every mistake into a step forward.', 'The way you handled that feedback showed me how growth happens and how you can learn from mistakes.'),
  (34, 'Organizer', 'Competence', 'You bring order to complexity. Your ability to structure things makes it possible for everyone to perform.', 'Thanks to you, everyone knew what they had to do today. That is invaluable.'),
  (35, 'Resilient', 'Competence', 'You remain stable when things go wrong. You put setbacks into perspective and recover quickly, making them feel less like major setbacks.', 'The way you recovered inspired me. You showed that you do not let yourself be stopped.'),
  (36, 'Results-Oriented', 'Competence', 'You keep the end goal clearly in mind. You know the difference between being busy and being productive, and you always choose what truly contributes to the goal.', 'You brought focus to what truly contributes. Thanks to you, we are making real progress.'),
  (37, 'Proactive', 'Competence', 'You do not wait. You see what is needed before others notice it, and you act before being asked.', 'You had already arranged this before I had even thought of it. That brings peace of mind.'),
  (38, 'Decision-Maker', 'Competence', 'You make decisions, even when not everything is clear. You know that not deciding can also be a choice, and you take responsibility for your choice.', 'You made a decision while we were still hesitating. Thanks to you, we could move forward.'),
  (39, 'Critical Thinker', 'Competence', 'You do not simply accept what is placed in front of you. Your critical eye protects quality and brings out the best.', 'Because you dared to ask, we gained insight in time. Without you, we would have missed that.'),
  (40, 'Caring', 'Collegiality', 'You pay attention to people, not out of obligation, but out of genuine care. You notice when things are not going well before someone has said it themselves.', 'Thanks to your care, I felt seen at a moment when I really needed it.'),
  (41, 'Loyal', 'Collegiality', 'You stand by the people around you, especially when things become difficult. You do not abandon people when times are tough, but choose loyalty, trust and genuine connection.', 'That you were there, even when it was difficult, means more than you know. Your loyalty gave me trust, stability and the certainty that I can count on you.'),
  (42, 'Team Player', 'Collegiality', 'You put the team''s interest first. You share credit, support others and contribute to the shared goal.', 'You kept the team strong today without needing to be in the foreground. Precisely because of that, everyone could perform better.'),
  (43, 'Trusted Confidant', 'Collegiality', 'People choose you when they need to share something confidential. You protect that trust carefully and discreetly.', 'I can tell you things I do not tell anyone else. That trust is not something to take for granted, and I am glad you are here.'),
  (44, 'Supportive', 'Collegiality', 'You are there for others when it counts. You help and offer support when they truly need it.', 'You were there for me, and that was exactly enough. You gave me calm and confidence when I needed it.'),
  (45, 'Respectful', 'Collegiality', 'You respect the boundaries, pace and perspectives of others. You do not impose, but create space so the other person can be themselves.', 'You gave me the space today to contribute in my own way. That felt like genuine collaboration.'),
  (46, 'Grateful', 'Collegiality', 'You see what others contribute and say it out loud. You let people know that their contribution matters, and that changes the atmosphere.', 'I appreciate that you said that out loud today. It gives me energy to keep going.'),
  (47, 'Inclusive', 'Collegiality', 'You make sure no one is left out. You bring quiet voices forward and create space for those who normally do not get space.', 'You made sure today that I belonged too. That gives me a sense of equality and of contributing something meaningful.'),
  (48, 'Patient', 'Collegiality', 'You give people the time they need. You do not force a pace that does not suit them, and that makes collaboration feel safe.', 'Because you gave me time without impatience, the pressure disappeared. That allowed me to show what I am capable of.'),
  (49, 'Protective', 'Collegiality', 'You stand up for others when needed. You do not allow people to be dismissed or ignored — gently, but firmly. You care for someone''s well-being.', 'I appreciate that you stood up for me. You made sure I felt safe.'),
  (50, 'Energetic', 'Collegiality', 'You bring energy into a room. Your presence lifts the team''s energy and helps us continue when others start to drop off.', 'Every time you are there, the atmosphere is better. That is purely your contribution. Your energy is contagious and brings enthusiasm.'),
  (51, 'Present', 'Collegiality', 'You are truly present. No half attention, no distraction you focus fully on the person in front of you.', 'You were fully there today, and I felt it. That makes the difference. Full attention is the best thing you can give someone.'),
  (52, 'Appreciative', 'Collegiality', 'You see the good in people. Your appreciation is not just a compliment; it is a mirror that allows people to stand taller. You make someone''s contribution visible through appreciation. This quality is the foundation for a good working environment, good employees and good results.', 'The fact that you appreciate my contribution makes me feel seen. It gives me strength, positivity and energy.'),
  (53, 'Open Card', 'Open Category', 'Fill in the quality you want to appreciate:', 'Create your own recognition sentence:')
)
update public.card_library as card
set
  title = official_cards.title,
  category = official_cards.category,
  description = official_cards.description,
  recognition_sentence = official_cards.recognition_sentence,
  updated_at = now()
from official_cards
where card.card_number = official_cards.card_number;

do $$
begin
  if exists (
    select 1
    from public.recognition_events event
    left join public.card_library card on card.id = event.card_id
    where card.id is null
  ) then
    raise exception 'Card sync validation failed: recognition_events contains an invalid card_id reference.';
  end if;
end $$;
