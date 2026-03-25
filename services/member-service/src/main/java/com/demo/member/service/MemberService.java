package com.demo.member.service;

import com.demo.member.dto.MemberRequest;
import com.demo.member.dto.MemberResponse;
import java.util.List;
import java.util.UUID;

public interface MemberService {
    List<MemberResponse> getAllMembers();
    MemberResponse getMemberById(UUID id);
    MemberResponse createMember(MemberRequest request);
    MemberResponse updateMember(UUID id, MemberRequest request);
    void deleteMember(UUID id);
}
