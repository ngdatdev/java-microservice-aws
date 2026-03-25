package com.demo.member.service;

import com.demo.member.dto.MemberRequest;
import com.demo.member.dto.MemberResponse;
import com.demo.member.entity.Member;
import com.demo.member.exception.MemberNotFoundException;
import com.demo.member.messaging.SnsPublisher;
import com.demo.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;
    private final SnsPublisher snsPublisher;

    @Override
    public List<MemberResponse> getAllMembers() {
        return memberRepository.findAll().stream()
                .map(MemberResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public MemberResponse getMemberById(UUID id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new MemberNotFoundException("Member not found with id: " + id));
        return MemberResponse.fromEntity(member);
    }

    @Override
    @Transactional
    public MemberResponse createMember(MemberRequest request) {
        Member member = Member.builder()
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .status(Member.MemberStatus.ACTIVE)
                .build();
        
        Member savedMember = memberRepository.save(member);
        snsPublisher.publishMemberEvent("MEMBER_CREATED", savedMember);
        return MemberResponse.fromEntity(savedMember);
    }

    @Override
    @Transactional
    public MemberResponse updateMember(UUID id, MemberRequest request) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new MemberNotFoundException("Member not found with id: " + id));
        
        member.setFullName(request.getFullName());
        member.setPhone(request.getPhone());
        member.setEmail(request.getEmail());
        
        Member updatedMember = memberRepository.save(member);
        snsPublisher.publishMemberEvent("MEMBER_UPDATED", updatedMember);
        return MemberResponse.fromEntity(updatedMember);
    }

    @Override
    @Transactional
    public void deleteMember(UUID id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new MemberNotFoundException("Member not found with id: " + id));
        
        memberRepository.delete(member);
        snsPublisher.publishMemberEvent("MEMBER_DELETED", member);
    }
}
